# Attendance & Access Control Mobile App

Administrative mobile application designed to interact with the IoT Attendance and Access Control API. This project serves as a management interface for registering, deregistering, and modifying workers, as well as for coordinating biometric enrollment hardware and assigning RFID cards through synchronization with Firebase Realtime Database.

## Project Scope

This application focuses exclusively on the administrative and hardware configuration functionalities currently implemented in the backend:

1.  **Employee Management (CRUD):**
    * Creation of new employee profiles.
    * Reading and listing existing employees.
    * Updating personal data.
    * Logical or physical deletion of records.

2.  **Synchronous Biometric Enrollment:**
    * Interface to start registration mode on the hardware (ESP32) through the API.
    * Management of the waiting flow and confirmation of fingerprint capture.

3.  **RFID Identifier Management:**
* Display of scanned unassigned RFID cards (card pool).
* Linking and unlinking RFID cards to specific worker profiles.

4.  **Status Monitoring:**
    * Polling of connectivity status and administrative hardware commands.

## Technology Stack

* **Framework:** React Native (Latest stable version)
* **Development Platform:** Expo Go
* **Language:** Ty
