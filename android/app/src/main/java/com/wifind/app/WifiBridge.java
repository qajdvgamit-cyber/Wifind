package com.wifind.app;

import android.Manifest;
import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.net.wifi.ScanResult;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.SystemClock;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.List;
import java.util.Locale;

/**
 * What the WiFind page can ask the phone, through {@code window.WiFindNative}.
 *
 * Every method only reads Wi-Fi information or opens a settings screen; nothing here changes the phone's settings.
 * Results go back to the page as JSON text. Events (new scan results, permission answers, the app coming back
 * to the front) are sent to {@code window.__wifindNative(type, data)}.
 */
@SuppressWarnings("deprecation") // getConnectionInfo, startScan and ScanResult.SSID are deprecated but still the simplest way to read this
public class WifiBridge {

    static final int REQUEST_WIFI_PERMISSIONS = 7;
    private static final String HIDDEN_BSSID = "02:00:00:00:00:00";
    private static final long MAX_SCAN_AGE_MS = 3 * 60 * 1000;

    private final Activity activity;
    private final WebView web;
    private final WifiManager wifi;
    private final ConnectivityManager connectivity;
    private final LocationManager location;
    private final SharedPreferences prefs;
    private boolean listening = false;

    private final BroadcastReceiver scanReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            emit("scan", "{}");
        }
    };

    WifiBridge(Activity activity, WebView web) {
        this.activity = activity;
        this.web = web;
        Context app = activity.getApplicationContext();
        wifi = (WifiManager) app.getSystemService(Context.WIFI_SERVICE);
        connectivity = (ConnectivityManager) app.getSystemService(Context.CONNECTIVITY_SERVICE);
        location = (LocationManager) app.getSystemService(Context.LOCATION_SERVICE);
        prefs = activity.getSharedPreferences("wifind", Context.MODE_PRIVATE);
    }

    // ------------------------------------------------------------------ called by the page

    /** The Wi-Fi connection right now: signal (dBm), network name, access point (BSSID), band, link speed. */
    @JavascriptInterface
    public String getWifiInfo() {
        JSONObject o = new JSONObject();
        try {
            boolean enabled = wifi != null && wifi.isWifiEnabled();
            boolean connected = enabled && onWifi();
            o.put("ok", wifi != null);
            o.put("wifiEnabled", enabled);
            o.put("connected", connected);
            o.put("permission", permissionState());
            o.put("locationEnabled", locationOn());
            if (connected) {
                WifiInfo info = wifi.getConnectionInfo();
                if (info != null) {
                    int rssi = info.getRssi();
                    if (rssi > -127 && rssi < 0) o.put("rssi", rssi);
                    String ssid = cleanSsid(info.getSSID());
                    if (ssid != null) o.put("ssid", ssid);
                    String bssid = info.getBSSID();
                    if (bssid != null && !HIDDEN_BSSID.equals(bssid)) o.put("bssid", bssid.toLowerCase(Locale.US));
                    o.put("linkSpeed", info.getLinkSpeed());
                    int freq = info.getFrequency();
                    if (freq > 0) {
                        o.put("freq", freq);
                        o.put("band", band(freq));
                        o.put("channel", channel(freq));
                    }
                    if (Build.VERSION.SDK_INT >= 30) {
                        String std = standard(info.getWifiStandard(), freq);
                        if (std != null) o.put("standard", std);
                    }
                }
            }
        } catch (JSONException | SecurityException e) {
            // send what we have
        }
        return o.toString();
    }

    /** Asks Android for a fresh scan. Android allows about 4 scans every 2 minutes; returns "false" when throttled. */
    @JavascriptInterface
    public String startScan() {
        try {
            return wifi != null && wifi.startScan() ? "true" : "false";
        } catch (SecurityException e) {
            return "false";
        }
    }

    /** Access points the phone can hear, from the latest scan. */
    @JavascriptInterface
    public String getScanResults() {
        JSONObject o = new JSONObject();
        JSONArray list = new JSONArray();
        boolean ok = true;
        try {
            List<ScanResult> results = wifi == null ? null : wifi.getScanResults();
            long nowMicros = SystemClock.elapsedRealtime() * 1000L;
            if (results != null) {
                for (ScanResult r : results) {
                    if (r.BSSID == null || HIDDEN_BSSID.equals(r.BSSID)) continue;
                    long ageMs = Math.max(0L, (nowMicros - r.timestamp) / 1000L);
                    if (ageMs > MAX_SCAN_AGE_MS) continue;
                    JSONObject a = new JSONObject();
                    a.put("ssid", r.SSID == null ? "" : r.SSID);
                    a.put("bssid", r.BSSID.toLowerCase(Locale.US));
                    a.put("rssi", r.level);
                    a.put("freq", r.frequency);
                    a.put("band", band(r.frequency));
                    a.put("channel", channel(r.frequency));
                    a.put("ageMs", ageMs);
                    list.put(a);
                }
            }
        } catch (SecurityException e) {
            ok = false; // no location permission yet
        } catch (JSONException e) {
            // send what we have
        }
        try {
            o.put("ok", ok);
            o.put("results", list);
        } catch (JSONException e) {
            // cannot happen with these values
        }
        return o.toString();
    }

    /** Shows Android's permission prompt for location (needed to read the network name and access point). */
    @JavascriptInterface
    public void requestPermission() {
        activity.runOnUiThread(() -> {
            prefs.edit().putBoolean("askedLocation", true).apply();
            String[] perms = Build.VERSION.SDK_INT >= 33
                    ? new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.NEARBY_WIFI_DEVICES}
                    : new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION};
            activity.requestPermissions(perms, REQUEST_WIFI_PERMISSIONS);
        });
    }

    /** Opens a settings screen: "wifi", "location", or anything else for WiFind's own app settings. */
    @JavascriptInterface
    public void openSettings(String which) {
        activity.runOnUiThread(() -> {
            Intent intent;
            if ("wifi".equals(which)) intent = new Intent(Settings.ACTION_WIFI_SETTINGS);
            else if ("location".equals(which)) intent = new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS);
            else intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", activity.getPackageName(), null));
            try {
                activity.startActivity(intent);
            } catch (RuntimeException e) {
                // this phone has no such settings screen
            }
        });
    }

    /** Opens Android's share sheet with some text (used for the access point list). */
    @JavascriptInterface
    public void share(String text) {
        activity.runOnUiThread(() -> {
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType("text/plain");
            send.putExtra(Intent.EXTRA_SUBJECT, "WiFind access points");
            send.putExtra(Intent.EXTRA_TEXT, text);
            try {
                activity.startActivity(Intent.createChooser(send, "Share the access point list"));
            } catch (RuntimeException e) {
                // nothing to share with
            }
        });
    }

    @JavascriptInterface
    public String getAppVersion() {
        try {
            return activity.getPackageManager().getPackageInfo(activity.getPackageName(), 0).versionName;
        } catch (PackageManager.NameNotFoundException e) {
            return "";
        }
    }

    // ------------------------------------------------------------------ called by MainActivity

    void onResume() {
        if (!listening) {
            IntentFilter filter = new IntentFilter(WifiManager.SCAN_RESULTS_AVAILABLE_ACTION);
            if (Build.VERSION.SDK_INT >= 33) activity.registerReceiver(scanReceiver, filter, Context.RECEIVER_EXPORTED);
            else activity.registerReceiver(scanReceiver, filter);
            listening = true;
        }
        emit("resume", "{}"); // permissions or settings may have changed while the app was in the background
    }

    void onPause() {
        release();
    }

    void release() {
        if (listening) {
            try {
                activity.unregisterReceiver(scanReceiver);
            } catch (IllegalArgumentException e) {
                // already unregistered
            }
            listening = false;
        }
    }

    void onPermissionResult(int requestCode) {
        if (requestCode != REQUEST_WIFI_PERMISSIONS) return;
        emit("permission", "{\"granted\":" + "granted".equals(permissionState()) + "}");
    }

    // ------------------------------------------------------------------ helpers

    private void emit(String type, String json) {
        web.post(() -> web.evaluateJavascript(
                "window.__wifindNative && window.__wifindNative(" + JSONObject.quote(type) + "," + json + ")", null));
    }

    /** True when the phone is joined to a Wi-Fi network, even one without internet (like a campus login page). */
    private boolean onWifi() {
        if (connectivity == null) return false;
        for (Network n : connectivity.getAllNetworks()) {
            NetworkCapabilities caps = connectivity.getNetworkCapabilities(n);
            if (caps != null && caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) return true;
        }
        return false;
    }

    /** "granted", "denied" (we can ask), or "blocked" (the user chose don't ask again; only settings can change it). */
    private String permissionState() {
        if (activity.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) return "granted";
        boolean asked = prefs.getBoolean("askedLocation", false);
        if (asked && !activity.shouldShowRequestPermissionRationale(Manifest.permission.ACCESS_FINE_LOCATION)) return "blocked";
        return "denied";
    }

    private boolean locationOn() {
        if (location == null) return false;
        if (Build.VERSION.SDK_INT >= 28) return location.isLocationEnabled();
        return Settings.Secure.getInt(activity.getContentResolver(), Settings.Secure.LOCATION_MODE, Settings.Secure.LOCATION_MODE_OFF)
                != Settings.Secure.LOCATION_MODE_OFF;
    }

    private static String cleanSsid(String ssid) {
        if (ssid == null || "<unknown ssid>".equals(ssid)) return null;
        if (ssid.length() >= 2 && ssid.startsWith("\"") && ssid.endsWith("\"")) ssid = ssid.substring(1, ssid.length() - 1);
        return ssid.isEmpty() ? null : ssid;
    }

    static String band(int freq) {
        if (freq < 3000) return "2.4 GHz";
        if (freq < 5925) return "5 GHz";
        return "6 GHz";
    }

    static int channel(int freq) {
        if (freq == 2484) return 14;
        if (freq < 3000) return (freq - 2407) / 5;
        if (freq < 5925) return (freq - 5000) / 5;
        return (freq - 5950) / 5;
    }

    /** ScanResult.WIFI_STANDARD_* values: 4 = 802.11n, 5 = 802.11ac, 6 = 802.11ax, 8 = 802.11be. */
    static String standard(int std, int freq) {
        switch (std) {
            case 4: return "Wi-Fi 4";
            case 5: return "Wi-Fi 5";
            case 6: return freq >= 5925 ? "Wi-Fi 6E" : "Wi-Fi 6";
            case 8: return "Wi-Fi 7";
            default: return null;
        }
    }
}
