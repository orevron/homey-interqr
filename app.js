'use strict';

const Homey = require('homey');

class InterQRApp extends Homey.App {
    async onInit() {
        this.log('InterQR app has been initialized');
    }
}

module.exports = InterQRApp;
