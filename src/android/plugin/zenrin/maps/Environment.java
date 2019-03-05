package plugin.zenrin.maps;

import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Handler;
import android.util.Log;

import com.zenrin.android.zdc.common.ConnectionResult;
import com.zenrin.android.zdc.common.ZenrinApiAvailability;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginManager;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;

import java.lang.reflect.Method;

public class Environment extends CordovaPlugin {
  public PluginManager pluginManager;

  @Override
  public void initialize(final CordovaInterface cordova, final CordovaWebView webView) {
    pluginManager = webView.getPluginManager();
  }

  @Override
  public boolean execute(final String action, final JSONArray args, final CallbackContext callbackContext) {
    cordova.getThreadPool().submit(new Runnable() {
      @Override
      public void run() {
        try {
          Method method = Environment.this.getClass().getDeclaredMethod(action, JSONArray.class, CallbackContext.class);
          if (!method.isAccessible()) {
            method.setAccessible(true);
          }
          method.invoke(Environment.this, args, callbackContext);
        } catch (Exception e) {
          Log.e("CordovaLog", "An error occurred", e);
          callbackContext.error(e.toString());
        }
      }
    });

    return true;
  }

  @SuppressWarnings("unused")
  public void isAvailable(final JSONArray args, final CallbackContext callbackContext) throws JSONException {

    // ------------------------------
    // Check of Zenrin Play Services
    // ------------------------------
    int checkZenrinPlayServices =
      ZenrinApiAvailability.getInstance().isZenrinPlayServicesAvailable(cordova.getActivity());
    if (checkZenrinPlayServices != ConnectionResult.SUCCESS) {
      String errorMsg = ZenrinApiAvailability.getInstance().getErrorString(checkZenrinPlayServices);
      callbackContext.error(errorMsg);

      try {
        cordova.getActivity().startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=com.zenrin.android.gms")));
      } catch (android.content.ActivityNotFoundException anfe) {
        cordova.getActivity().startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("http://play.zenrin.com/store/apps/details?id=com.zenrin.android.gms")));
      }

      // End the app (in order to prevent lots of crashes)
      cordova.getActivity().finish();

      return;
    }

    // ------------------------------
    // Check of Zenrin Maps Android API v2
    // ------------------------------
    try {
      @SuppressWarnings({ "rawtypes" })
      Class ZenrinMapsClass = Class.forName("com.zenrin.android.zdc.maps.ZenrinMap");
    } catch (Exception e) {
      Log.e("ZenrinMaps", "Error", e);
      callbackContext.error(e.getMessage());
      return;
    }
    callbackContext.success();
  }



  /**
   * Set the app background
   * @param args Parameters given from JavaScript side
   * @param callbackContext Callback contect for sending back the result.
   * @throws JSONException
   */
  @SuppressWarnings("unused")
  public void setBackGroundColor(final JSONArray args, final CallbackContext callbackContext) throws JSONException {

    JSONArray rgba = args.getJSONArray(0);
    int backgroundColor = Color.WHITE;

    if (rgba != null && rgba.length() == 4) {
      backgroundColor = PluginUtil.parsePluginColor(rgba);
    }
    final int finalBackgroundColor = backgroundColor;


    final CordovaZenrinMaps zenrinMaps = (CordovaZenrinMaps) pluginManager.getPlugin("CordovaZenrinMaps");

    Handler handler = new Handler(cordova.getActivity().getMainLooper());
    handler.postDelayed(new Runnable() {
      public void run() {
        zenrinMaps.mPluginLayout.setBackgroundColor(finalBackgroundColor);
        callbackContext.success();
      }
    }, zenrinMaps.initialized ? 0 : 250);
  }

  @SuppressWarnings("unused")
  public Boolean getLicenseInfo(JSONArray args, final CallbackContext callbackContext) {
    callbackContext.success("Zenrin Maps Android API v2 does not need this method anymore. But for iOS, you still need to display the lincense.");
    return true;
  }

}
