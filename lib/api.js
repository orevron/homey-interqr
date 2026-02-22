"use strict";

const crypto = require('crypto');

const DEFAULT_BASE_URL = "https://www.interqr.com/api";
const ENDPOINT_INIT = "/init";
const ENDPOINT_LOGIN = "/login";
const ENDPOINT_LOGOUT = "/logout";
const ENDPOINT_TWOFA_START = "/twofa/start";
const ENDPOINT_TWOFA_VERIFY = "/twofa/verify";
const ENDPOINT_USER_DETAILS = "/resource/user/details";
const ENDPOINT_UNLOCK = "/locks/{uuid}/unlock";
const ENDPOINT_UNLOCK_LONG = "/locks/{uuid}/unlock-long";

const APP_VERSION = "3.5.8";
const DEVICE_MANUFACTURER = "Athom";
const DEVICE_MODEL = "Integration";
const DEVICE_PLATFORM = "Homey";

class InterQRApiClient {
  constructor(baseUrl = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = null;
    this.deviceUuid = null;
  }

  setToken(token) {
    this.token = token;
  }

  setDeviceUuid(uuid) {
    this.deviceUuid = uuid;
  }

  async _request(method, endpoint, { jsonData = null, authenticated = false } = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json'
    };
    if (authenticated && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const options = {
      method,
      headers
    };

    if (jsonData) {
      options.body = JSON.stringify(jsonData);
    }

    const response = await fetch(url, options);

    const contentType = response.headers.get('Content-Type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Unexpected response type from server: ${contentType}`);
    }

    const data = await response.json();

    if (response.status === 401) {
      throw new Error('Authentication failed');
    }

    if (response.status >= 400) {
      throw new Error(`API error (HTTP ${response.status})`);
    }

    return data;
  }

  async initDevice(deviceUuid = null) {
    if (!deviceUuid) {
      deviceUuid = crypto.randomUUID();
    }
    this.deviceUuid = deviceUuid;

    const payload = {
      device_uuid: this.deviceUuid,
      manufacturer: DEVICE_MANUFACTURER,
      model: DEVICE_MODEL,
      platform: DEVICE_PLATFORM,
      os_version: "1.0",
      app_version: APP_VERSION
    };

    const result = await this._request('POST', ENDPOINT_INIT, { jsonData: payload });
    if (result && result.data && result.data.device_uuid) {
      this.deviceUuid = result.data.device_uuid;
    }
    return result;
  }

  async start2FA(phoneNumber, deviceUuid) {
    const payload = {
      number: phoneNumber,
      device_uuid: deviceUuid
    };
    return await this._request('POST', ENDPOINT_TWOFA_START, { jsonData: payload });
  }

  async verify2FA(phoneNumber, code, deviceUuid, secondAuthToken = null) {
    const payload = {
      number: phoneNumber,
      code: code,
      device_uuid: deviceUuid
    };
    if (secondAuthToken) {
      payload.second_auth_token = secondAuthToken;
    }

    const result = await this._request('POST', ENDPOINT_TWOFA_VERIFY, { jsonData: payload });
    if (result && result.data && result.data.token) {
      this.token = result.data.token;
    } else {
      throw new Error('No token in verify response');
    }

    return result;
  }

  async login(deviceUuid = null) {
    const uuidToUse = deviceUuid || this.deviceUuid;
    if (!uuidToUse) {
      throw new Error('No device_uuid available for login');
    }

    const payload = { device_uuid: uuidToUse };
    const result = await this._request('POST', ENDPOINT_LOGIN, { jsonData: payload });
    if (result && result.data && result.data.token) {
      this.token = result.data.token;
    }
    return result;
  }

  async logout() {
    if (!this.token) return;
    try {
      await this._request('POST', ENDPOINT_LOGOUT, { authenticated: true });
    } catch (err) {
      // Best-effort logout
    } finally {
      this.token = null;
    }
  }

  async getUserDetails() {
    return await this._request('GET', ENDPOINT_USER_DETAILS, { authenticated: true });
  }

  async unlock(lockUuid) {
    const endpoint = ENDPOINT_UNLOCK.replace('{uuid}', lockUuid);
    return await this._request('POST', endpoint, { authenticated: true });
  }

  async unlockLong(lockUuid) {
    const endpoint = ENDPOINT_UNLOCK_LONG.replace('{uuid}', lockUuid);
    return await this._request('POST', endpoint, { authenticated: true });
  }
}

module.exports = InterQRApiClient;
