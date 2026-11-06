# Phase-04: Role Alignment (Member QR & Door Scanner)

## Context
Now that we have successfully built both the Camera Scanner (Phase-02) and the TOTP Dynamic QR Generator (Phase-03), we need to assign them to their final production roles. The Door will act strictly as the Scanner, and the Members will generate the refreshing QR codes on their personal devices.

## Scope
- Move the dynamic QR generation logic into the main Member dashboard.
- Ensure the Door Kiosk (`scanner@gmail.com`) remains dedicated solely to scanning.
- Connect the scanner's output to read the member's generated payload.

## Steps

1. **Migrate QR Generator to Member Role:**
   - Locate the QR generation logic (the 15-second `setInterval` and `react-native-qrcode-svg` component) built in Phase-03.
   - Copy this logic into the Member's main check-in screen (e.g., `src/app/(member)/index.tsx` or a dedicated `checkin.tsx` tab).
   - Update the `generatePayload()` function to use the actual logged-in Member's User ID from your authentication state instead of the mocked "test-user-123".

2. **Clean Up Test Accounts:**
   - You can safely remove the `qrcode@gmail.com` routing logic from `_layout.tsx`, as members will now natively handle their own QR generation.
   - Keep `scanner@gmail.com` active, as this remains the permanent account for the physical Door Device.

3. **Validate the Handshake:**
   - Update the `onBarcodeScanned` function in the Door Scanner (`src/app/(kiosk)/scanner.tsx`).
   - When it scans a member's QR, parse the string (e.g., separating the Member ID and the Timestamp) and display an alert: "Member [ID] Check-in Requested at [Time]".

## Verification

- [ ] Members logging into their normal accounts see a dynamic, refreshing QR code natively in their dashboard.
- [ ] The `qrcode@gmail.com` test route is cleanly removed with no broken links.
- [ ] Scanning a live member's screen with the Door Device successfully reads that specific member's ID and timestamp.

## You need to:
1. Approve this alignment plan.
2. Ensure your backend (Appwrite/Supabase) has a table ready for "Attendance Logs" for the next phase where we save these scans to the database.

## Test it yourself:
1. Log in to your personal member account on Device A and navigate to the home/check-in tab. You should see your dynamic QR code.
2. Log in as `scanner@gmail.com` on Device B.
3. Scan Device A with Device B. 
4. **Expected:** Device B confirms the exact User ID of your personal account from Device A.

## Result
Status: Pending Approval