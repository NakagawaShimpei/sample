# Details

Date : 2026-05-21 14:43:10

Directory c:\\Users\\r00528311\\source\\exercise\\sample\\backend\\src

Total : 42 files,  1914 codes, 28 comments, 322 blanks, all 2264 lines

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [backend/src/config.ts](/backend/src/config.ts) | TypeScript | 36 | 0 | 4 | 40 |
| [backend/src/controllers/AuthController.ts](/backend/src/controllers/AuthController.ts) | TypeScript | 133 | 1 | 14 | 148 |
| [backend/src/controllers/ChatController.ts](/backend/src/controllers/ChatController.ts) | TypeScript | 192 | 0 | 26 | 218 |
| [backend/src/controllers/DeviceController.ts](/backend/src/controllers/DeviceController.ts) | TypeScript | 27 | 0 | 6 | 33 |
| [backend/src/controllers/HistoryController.ts](/backend/src/controllers/HistoryController.ts) | TypeScript | 11 | 0 | 4 | 15 |
| [backend/src/controllers/LoanController.ts](/backend/src/controllers/LoanController.ts) | TypeScript | 35 | 0 | 7 | 42 |
| [backend/src/controllers/MfaController.ts](/backend/src/controllers/MfaController.ts) | TypeScript | 74 | 5 | 10 | 89 |
| [backend/src/controllers/ReservationController.ts](/backend/src/controllers/ReservationController.ts) | TypeScript | 128 | 0 | 20 | 148 |
| [backend/src/controllers/RoomController.ts](/backend/src/controllers/RoomController.ts) | TypeScript | 18 | 0 | 5 | 23 |
| [backend/src/controllers/UserController.ts](/backend/src/controllers/UserController.ts) | TypeScript | 27 | 0 | 5 | 32 |
| [backend/src/database.ts](/backend/src/database.ts) | TypeScript | 72 | 0 | 7 | 79 |
| [backend/src/index.ts](/backend/src/index.ts) | TypeScript | 46 | 5 | 5 | 56 |
| [backend/src/middleware/auditLog.ts](/backend/src/middleware/auditLog.ts) | TypeScript | 37 | 2 | 9 | 48 |
| [backend/src/middleware/authenticate.ts](/backend/src/middleware/authenticate.ts) | TypeScript | 33 | 0 | 2 | 35 |
| [backend/src/middleware/requireAdmin.ts](/backend/src/middleware/requireAdmin.ts) | TypeScript | 12 | 0 | 2 | 14 |
| [backend/src/repositories/DeviceRepository.ts](/backend/src/repositories/DeviceRepository.ts) | TypeScript | 8 | 0 | 3 | 11 |
| [backend/src/repositories/HistoryRepository.ts](/backend/src/repositories/HistoryRepository.ts) | TypeScript | 16 | 0 | 3 | 19 |
| [backend/src/repositories/JsonRepository.ts](/backend/src/repositories/JsonRepository.ts) | TypeScript | 78 | 2 | 15 | 95 |
| [backend/src/repositories/LoanRepository.ts](/backend/src/repositories/LoanRepository.ts) | TypeScript | 8 | 0 | 3 | 11 |
| [backend/src/repositories/ReservationRepository.ts](/backend/src/repositories/ReservationRepository.ts) | TypeScript | 8 | 0 | 3 | 11 |
| [backend/src/repositories/RoomRepository.ts](/backend/src/repositories/RoomRepository.ts) | TypeScript | 8 | 0 | 3 | 11 |
| [backend/src/repositories/SqliteRepository.ts](/backend/src/repositories/SqliteRepository.ts) | TypeScript | 69 | 0 | 11 | 80 |
| [backend/src/repositories/UserRepository.ts](/backend/src/repositories/UserRepository.ts) | TypeScript | 19 | 0 | 6 | 25 |
| [backend/src/routes/authRoutes.ts](/backend/src/routes/authRoutes.ts) | TypeScript | 27 | 0 | 6 | 33 |
| [backend/src/routes/chatRoutes.ts](/backend/src/routes/chatRoutes.ts) | TypeScript | 6 | 0 | 4 | 10 |
| [backend/src/routes/deviceRoutes.ts](/backend/src/routes/deviceRoutes.ts) | TypeScript | 10 | 0 | 4 | 14 |
| [backend/src/routes/historyRoutes.ts](/backend/src/routes/historyRoutes.ts) | TypeScript | 11 | 0 | 4 | 15 |
| [backend/src/routes/loanRoutes.ts](/backend/src/routes/loanRoutes.ts) | TypeScript | 10 | 0 | 4 | 14 |
| [backend/src/routes/mfaRoutes.ts](/backend/src/routes/mfaRoutes.ts) | TypeScript | 10 | 0 | 4 | 14 |
| [backend/src/routes/reservationRoutes.ts](/backend/src/routes/reservationRoutes.ts) | TypeScript | 10 | 0 | 4 | 14 |
| [backend/src/routes/roomRoutes.ts](/backend/src/routes/roomRoutes.ts) | TypeScript | 9 | 0 | 4 | 13 |
| [backend/src/routes/userRoutes.ts](/backend/src/routes/userRoutes.ts) | TypeScript | 9 | 0 | 4 | 13 |
| [backend/src/services/AuthService.ts](/backend/src/services/AuthService.ts) | TypeScript | 82 | 1 | 15 | 98 |
| [backend/src/services/CryptoService.ts](/backend/src/services/CryptoService.ts) | TypeScript | 46 | 0 | 7 | 53 |
| [backend/src/services/DeviceService.ts](/backend/src/services/DeviceService.ts) | TypeScript | 19 | 0 | 6 | 25 |
| [backend/src/services/LoanService.ts](/backend/src/services/LoanService.ts) | TypeScript | 70 | 0 | 12 | 82 |
| [backend/src/services/MfaService.ts](/backend/src/services/MfaService.ts) | TypeScript | 29 | 0 | 7 | 36 |
| [backend/src/services/PasswordResetService.ts](/backend/src/services/PasswordResetService.ts) | TypeScript | 79 | 3 | 14 | 96 |
| [backend/src/services/ReservationService.ts](/backend/src/services/ReservationService.ts) | TypeScript | 231 | 3 | 27 | 261 |
| [backend/src/services/RoomService.ts](/backend/src/services/RoomService.ts) | TypeScript | 16 | 0 | 5 | 21 |
| [backend/src/services/UserService.ts](/backend/src/services/UserService.ts) | TypeScript | 40 | 0 | 7 | 47 |
| [backend/src/types.ts](/backend/src/types.ts) | TypeScript | 105 | 6 | 11 | 122 |

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)