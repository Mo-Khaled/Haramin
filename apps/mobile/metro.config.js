// Sentry's wrapper around Expo's default Metro config adds debug IDs so crash reports map to source.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
