# InterQR for Homey

Control your InterQR locks directly from Homey.

## Description
This app allows you to integrate your InterQR smart locks into your Homey ecosystem. You can easily add your locks using the same phone number and SMS verification code used in the InterQR mobile app. Once added, you can unlock your doors using Homey Flows, manual controls, or any connected voice assistants.

## Features
- **Unlock InterQR Locks:** Open connected building or office doors with a tap or via Flows.
- **Auto-Relock State Tracking:** InterQR systems are typically "unlock-only" access controls (the physical door locks automatically). To ensure consistency, Homey will automatically revert the device state back to "locked" 5 seconds after an unlock command is issued.
- **Seamless Authentication:** Log in using your mobile number and SMS 2FA code. The integration securely manages session tokens in the background and automatically re-authenticates when necessary.

## Supported Devices
- InterQR Smart Locks (including Palgate-compatible locks managed via InterQR)

## Installation & Setup
1. Install the **InterQR** app on your Homey.
2. Go to the **Devices** tab and tap the **+** button to add a new device.
3. Search for and select **InterQR**, then choose **InterQR Lock**.
4. Enter the phone number associated with your InterQR account (include the country code, e.g., `+1234567890`).
5. You will receive an SMS with a verification code. Enter this 4-digit code into the Homey pairing screen.
6. Select the locks you wish to add from the discovered list and complete the pairing.

## Usage
Once installed, your InterQR lock will appear as a standard lock device in Homey, displaying a locked/unlocked status.

### Supported Capabilities
- **Locked / Unlocked (Action & Status):** Toggling the lock to "unlocked" will send the unlock command to the InterQR API. Re-locking it manually does not trigger a physical action but ensures the state remains consistent.

### Flow Cards
- **Then (Action):** Unlock the door.
- **Then (Action):** Lock the door (updates Homey state).

## Technical Information
- **Compatibility:** Homey Pro (Local) & Homey Cloud (`>=5.0.0`).
- **API Communication:** Communicates directly with the official InterQR Cloud API (`https://www.interqr.com/api`).
- **Authentication:** Uses secure SMS-based 2FA to generate an authentication token. Bearer authentication tokens are stored securely per device and automatically refreshed upon expiration (e.g., when the API returns an HTTP 401).
- **Emulation:** The app registers with the InterQR servers as an Athom Homey platform integration. 

## Support & Contributing
If you encounter any issues, experience authentication failures, or have feature requests, please report them on the project's GitHub repository or check the Homey Community Forum.

## License
This project is licensed under the ISC License.
