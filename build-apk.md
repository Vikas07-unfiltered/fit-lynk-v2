# How to Build and Download Your Fit-Lynk Android App

## Method 1: Build APK File (Direct Installation)

### Prerequisites
1. **Install Android Studio**: Download from https://developer.android.com/studio
2. **Install Java Development Kit (JDK)**: Android Studio usually includes this

### Steps to Build APK:

1. **Open Terminal/Command Prompt** and run:
   ```bash
   npm run android
   ```

2. **This will**:
   - Build your React app
   - Sync files to Android project
   - Open Android Studio automatically

3. **In Android Studio**:
   - Wait for project to load and sync
   - Click on **"Build"** menu → **"Build Bundle(s) / APK(s)"** → **"Build APK(s)"**
   - Wait for build to complete (usually 2-5 minutes)

4. **Find Your APK**:
   - Look for notification: "APK(s) generated successfully"
   - Click **"locate"** or find it at: `android/app/build/outputs/apk/debug/app-debug.apk`

5. **Install APK**:
   - Transfer APK file to your Android phone
   - Enable "Install from Unknown Sources" in phone settings
   - Tap the APK file to install

## Method 2: Run on Connected Device

### For Testing on Your Phone:

1. **Enable Developer Options** on your Android phone:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings → Developer Options
   - Enable "USB Debugging"

2. **Connect Phone to Computer** via USB

3. **Run the app**:
   ```bash
   npm run android
   ```

4. **In Android Studio**:
   - Your phone should appear in device list
   - Click the green "Run" button (▶️)
   - App will install and launch on your phone

## Method 3: Use Android Emulator

### For Testing Without Physical Device:

1. **In Android Studio**:
   - Go to Tools → AVD Manager
   - Create Virtual Device
   - Choose a phone model (e.g., Pixel 6)
   - Download system image (Android 13+)
   - Start emulator

2. **Run the app**:
   ```bash
   npm run android
   ```

3. **App will install on emulator**

## Method 4: Generate Signed APK (For Distribution)

### For Sharing with Others:

1. **Generate Keystore** (one-time setup):
   ```bash
   keytool -genkey -v -keystore fit-lynk-key.keystore -alias fit-lynk -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **In Android Studio**:
   - Build → Generate Signed Bundle / APK
   - Choose APK
   - Create new keystore or use existing
   - Build release APK

3. **Share the signed APK** with others

## Quick Start Commands:

```bash
# Build and open in Android Studio
npm run android

# Build in development mode
npm run android:dev

# Just sync files (if Android Studio already open)
npm run cap:sync

# Build web app and sync
npm run cap:build
```

## File Locations:

- **Debug APK**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release APK**: `android/app/build/outputs/apk/release/app-release.apk`
- **Android Project**: `android/` folder

## Troubleshooting:

### If Android Studio doesn't open automatically:
```bash
# Sync first
npm run cap:sync

# Then manually open Android Studio and open the 'android' folder
```

### If build fails:
1. Make sure Android Studio is updated
2. Check Java version (should be JDK 11 or higher)
3. Clean and rebuild: Build → Clean Project → Rebuild Project

### For first-time setup:
- Android Studio will download required SDK components
- This may take 10-30 minutes depending on internet speed
- Accept all license agreements when prompted

## App Features in Android:

✅ **Native Performance**: Runs as native Android app
✅ **Offline Support**: Works without internet for cached data
✅ **Camera Access**: QR code scanning for attendance
✅ **Push Notifications**: Ready for future implementation
✅ **App Icon**: Custom Fit-Lynk branding
✅ **Splash Screen**: Professional startup experience

Your Fit-Lynk gym management system is now a fully functional Android app! 🎉