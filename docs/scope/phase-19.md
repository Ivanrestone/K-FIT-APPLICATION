# Phase 19: Hardware Door Lock Integration (Raspberry Pi LAN Server)

## Overview
Integrate the 12V magnetic door lock mechanism into the K-FIT application check-in workflow. When a member successfully checks in or scans their pass, the client application will asynchronously trigger an HTTP request to the local Raspberry Pi Flask LAN server to temporarily disengage the lock.

## Objectives

### 1. Configuration & Environment
- Define an optional environment variable `NEXT_PUBLIC_PI_LOCK_URL` in `.env.local` pointing to the Raspberry Pi LAN endpoint:
  ```env
  NEXT_PUBLIC_PI_LOCK_URL=[http://192.168.254.109:5000/unlock](http://192.168.254.109:5000/unlock)