# Customer and Driver mobile foundations

The existing mobile-first React UI and tested delivery logic remain usable. Capacitor wrappers preserve this working UI and add native capabilities; a React Native rewrite would require replacing DOM layouts, controls, routing and styling. This is a deliberate reuse decision, not an assumption that React web components are native components.

Separate projects: `apps/customer-mobile` (`com.porter.customer`) and `apps/driver-mobile` (`com.porter.driver`). Both have generated Android and Xcode projects, independent branding, names and native configuration. Bundle IDs are provisional until store ownership is confirmed. Web PWAs also have distinct manifests, PNG icons, standalone display and safe offline pages.

## Build and device setup

1. Configure each web app's public `VITE_API_URL` to a reachable HTTPS API before building native assets; `/api` is for web deployments, not a bundled native origin.
2. Configure server `NATIVE_ORIGINS=capacitor://localhost,https://localhost`, and `SESSION_CROSS_SITE=true` for cross-site native cookies. Retain explicit web origins. Verify session behavior on actual Android/iOS WebViews; browser third-party cookie restrictions may require a dedicated secure native-session transport before release.
3. Run the corresponding web workspace build, then `npm run sync --workspace=apps/customer-mobile` or `apps/driver-mobile`. Generated web copies are ignored in Git. Native project creation and plugin synchronization succeeded on Windows.
4. Open Android in Android Studio with an installed SDK/JDK, or iOS on macOS with Xcode and signing identities. Run on real devices. No APK/IPA has been compiled or installed in this environment.
5. Configure FCM for Android and APNs capability/signing for iOS. Keep Google provider files and signing credentials private; they are ignored. APNs registration callbacks and authenticated device-token persistence are implemented. Delivery still requires a real notification gateway and native provider accounts.

## Permissions and recovery

Driver location begins only after an explicit Share location action. Native uses the Geolocation plugin; web uses browser geolocation. Camera uses a native permission request and compressed capture, with existing file-picker fallback. Push permission and registration are explicit in Notifications. Permission denial gives a clear message without disabling manual delivery management. Tokens are associated with the authenticated account, removed on logout and never returned in marketplace state.

Native manifests declare camera, foreground location and notification permissions; iOS purpose strings describe their use. Android backup is disabled. Existing mobile navigation remains separate for each role. Server timestamps distinguish the last coordinate from current live GPS. Proof upload size limits are enforced server-side. No offline delivery changes are silently committed. Lost network command responses get one retry with the same idempotency key; uncertain results must be checked after reconnecting.

Background location is intentionally not enabled or claimed. Before implementing it, choose a supported native location service, define driver duty/consent windows, apply platform permission sequencing and foreground-service/battery constraints, stop tracking on logout/offline/end of work, encrypt bounded queued coordinates and reconcile by timestamp after connectivity resumes. Obtain platform/store/privacy approval and test suspension, force-stop, low battery and device restart. Foreground watch alone is insufficient for this requirement.

## Required real-device matrix

Android and iOS: own-account sign-in and re-login; approval/expiry blocks; cross-device booking/acceptance; camera/album permission denial and success; oversized/cancelled image; foreground GPS allow/deny/stop; push opt-in/denial/provider receipt/logout; airplane mode during acceptance/completion and retry; keyboard/safe areas; rotation; app background/kill/relaunch. Native compilation, APNs/FCM delivery, background location, hardware tests and store submission remain unverified.

References: [Capacitor platform documentation](https://capacitorjs.com/docs), [camera API](https://capacitorjs.com/docs/apis/camera), [geolocation API](https://capacitorjs.com/docs/apis/geolocation), [push API](https://capacitorjs.com/docs/apis/push-notifications).
