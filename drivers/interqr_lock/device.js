'use strict';

const Homey = require('homey');
const InterQRApiClient = require('../../lib/api');

class InterQRLockDevice extends Homey.Device {
    async onInit() {
        this.log('InterQR Lock device has been initialized:', this.getName());

        const store = this.getStore();
        this.api = new InterQRApiClient();
        this.api.setToken(store.token);
        this.api.setDeviceUuid(store.deviceUuid);

        // Ensure the capabilities are registered properly
        if (!this.hasCapability('locked')) {
            await this.addCapability('locked');
        }

        // Default state: Home Assistant integration assumes always locked
        await this.setCapabilityValue('locked', true);

        this.registerCapabilityListener('locked', async (value, opts) => {
            // InterQR lock is an "unlock only" system. When `locked` capability
            // changes to `false`, we send the unlock command.
            // If the user tries to set it to `true`, we just confirm the state.

            if (!value) {
                this.log('Unlocking lock:', this.getName());
                try {
                    const lockUuid = this.getData().id;

                    try {
                        await this.api.unlock(lockUuid);
                    } catch (unlockErr) {
                        if (unlockErr.message && (unlockErr.message.includes('Authentication failed') || unlockErr.message.includes('HTTP 401'))) {
                            this.log('Auth token expired. Logging in again...');
                            await this.api.login();

                            // Save the fresh token in store
                            await this.setStoreValue('token', this.api.token);

                            // Retry unlock
                            await this.api.unlock(lockUuid);
                        } else {
                            throw unlockErr;
                        }
                    }

                    this.log('Successfully unlocked lock:', this.getName());

                    // The API doesn't support locking, it auto locks after 5 seconds
                    if (this.relockTimeout) {
                        clearTimeout(this.relockTimeout);
                    }

                    this.relockTimeout = setTimeout(async () => {
                        this.log('Auto-relocking lock:', this.getName());
                        try {
                            await this.setCapabilityValue('locked', true);
                        } catch (err) {
                            this.error('Failed to set locking status:', err);
                        }
                    }, 5000); // 5 seconds delay to match Home Assistant integration RELOCK_DELAY

                    return true;
                } catch (err) {
                    this.error('Failed to unlock lock:', err);
                    throw new Error('Unlock failed: ' + err.message);
                }
            } else {
                // Just confirming locked state, as it's unlock-only system
                this.log('Lock command received (confirming locked state)');
                if (this.relockTimeout) {
                    clearTimeout(this.relockTimeout);
                }
                return true;
            }
        });
    }

    onDeleted() {
        this.log('Lock deleted');
        if (this.relockTimeout) {
            clearTimeout(this.relockTimeout);
        }
    }
}

module.exports = InterQRLockDevice;
