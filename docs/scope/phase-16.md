# Phase 16: QR Attendance Scanner & Member Check-in Records


## Overview
This phase implements a simple QR-based attendance system. The admin will use a built-in scanner to test member QR codes. The system will accurately log the exact **date, time, and year** for every scan. The frontend will be reorganized so that clicking on any member opens their complete, organized attendance history.

## 1. Database Logic (The Check-In & Check-Out Flow)
*   **The Attendance Table:** Set up a Supabase table to record attendance. It must explicitly capture the **Date**, **Year**, **Check-in Time**, and **Check-out Time**.
*   **1st Scan (Check-In):** When the admin scans a member's QR code, the backend checks if they have an active session. If not, it creates a new record logging the exact check-in date, time, and year.
*   **2nd Scan (Check-Out):** When the admin scans that same member's QR code again, the backend finds the open record and updates it with the exact check-out date, time, and year, completing their session.

## 2. Frontend Organization: Admin UI
*   **Admin QR Scanner:** Add a simple camera scanner to the admin dashboard used specifically to scan member QR codes and trigger the IN/OUT backend logic.
*   **Member Profile Reorganization:** Adjust the admin UI so that when an admin clicks on a specific member's name from the user list, it opens a dedicated profile view.
*   **Attendance History List:** Inside that member's view, fetch and display a clean, organized list of their past visits. Each row must clearly display the **Date, Year, Time In, and Time Out**.

## 3. Frontend Organization: Member UI
*   **Personal QR Code:** Display a static, unique QR code on the member's dashboard for the admin to scan.
*   **Personal Attendance Record:** Add an organized section where the member can see their own history of visits, formatted with the exact date, year, and IN/OUT times so they can track their gym usage.