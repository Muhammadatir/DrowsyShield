package com.drowsyshield.app;

import android.content.Intent;
import android.net.Uri;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * EmergencyPlugin
 *
 * Provides two native Android capabilities that cannot be done from JavaScript:
 *
 * 1. dialEmergency() — Opens the Android dialer pre-filled with 112.
 *    Uses ACTION_DIAL (not ACTION_CALL), which is always permitted.
 *    The user must tap the green call button — Android does NOT allow
 *    apps to auto-dial emergency numbers programmatically.
 *
 * 2. sendSmsIntent() — Opens the SMS app pre-filled with a message.
 *    Used as a fallback if the Twilio Edge Function is unreachable.
 *
 * Both methods are fire-and-forget intents. They bring the relevant
 * system app to the foreground; DrowsyShield moves to the background.
 */
@CapacitorPlugin(name = "Emergency")
public class EmergencyPlugin extends Plugin {

    private static final String TAG = "EmergencyPlugin";

    /**
     * Opens the Android dialer pre-filled with 112.
     * No CALL_PHONE permission required for ACTION_DIAL.
     * The user sees the dialer and must tap the call button.
     */
    @PluginMethod
    public void dialEmergency(PluginCall call) {
        try {
            String number = call.getString("number", "112");
            Intent intent = new Intent(Intent.ACTION_DIAL);
            intent.setData(Uri.parse("tel:" + number));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            Log.i(TAG, "Dialer opened for: " + number);
            JSObject result = new JSObject();
            result.put("opened", true);
            result.put("number", number);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Failed to open dialer", e);
            call.reject("Failed to open dialer: " + e.getMessage());
        }
    }

    /**
     * Opens the SMS app pre-filled with a recipient and message body.
     * Used as fallback when Twilio is unreachable.
     * The user must tap Send — Android does not allow silent SMS sending.
     */
    @PluginMethod
    public void sendSmsIntent(PluginCall call) {
        try {
            String phone   = call.getString("phone", "");
            String message = call.getString("message", "");

            if (phone.isEmpty()) {
                call.reject("phone is required");
                return;
            }

            Intent intent = new Intent(Intent.ACTION_SENDTO);
            intent.setData(Uri.parse("smsto:" + Uri.encode(phone)));
            intent.putExtra("sms_body", message);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            Log.i(TAG, "SMS intent opened for: " + phone);
            JSObject result = new JSObject();
            result.put("opened", true);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Failed to open SMS app", e);
            call.reject("Failed to open SMS app: " + e.getMessage());
        }
    }
}
