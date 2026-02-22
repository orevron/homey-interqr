'use strict';

const Homey = require('homey');
const InterQRApiClient = require('../../lib/api');

class InterQRLockDriver extends Homey.Driver {
    async onInit() {
        this.log('InterQR Lock driver has been initialized');
    }

    async onPair(session) {
        let api = new InterQRApiClient();
        let phone = null;
        let deviceUuid = null;
        let locks = [];
        let token = null;

        session.setHandler('verify_phone', async (data) => {
            phone = data.phone;
            try {
                const initResult = await api.initDevice();
                deviceUuid = initResult.data?.device_uuid || api.deviceUuid;
                await api.start2FA(phone, deviceUuid);
                return true;
            } catch (err) {
                this.error('Error in verify_phone', err);
                throw new Error(err.message || 'Failed to send SMS');
            }
        });

        session.setHandler('verify_code', async (data) => {
            try {
                const verifyResult = await api.verify2FA(phone, data.code, deviceUuid);
                token = verifyResult.data?.token || api.token;

                const userDetails = await api.getUserDetails();
                locks = userDetails.data?.locks || [];
                return true;
            } catch (err) {
                this.error('Error in verify_code', err);
                throw new Error(err.message || 'Invalid code');
            }
        });

        session.setHandler('list_devices', async () => {
            return locks.map(lock => {
                return {
                    name: lock.description || lock.lock_description || 'InterQR Lock',
                    data: {
                        id: lock.lock_uuid
                    },
                    store: {
                        token: token,
                        deviceUuid: deviceUuid,
                        allowLongUnlock: lock.allow_long_unlock === '1' || lock.allow_long_unlock === 'true' || lock.allow_long_unlock === true,
                        isPalgateLock: lock.is_palgate_lock,
                        buildingDescription: lock.building_description
                    }
                };
            });
        });
    }
}

module.exports = InterQRLockDriver;
