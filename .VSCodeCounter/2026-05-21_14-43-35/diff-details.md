# Diff Details

Date : 2026-05-21 14:43:35

Directory c:\\Users\\r00528311\\source\\exercise\\sample\\frontend\\src

Total : 93 files,  4587 codes, 29 comments, 301 blanks, all 4917 lines

[Summary](results.md) / [Details](details.md) / [Diff Summary](diff.md) / Diff Details

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [backend/src/config.ts](/backend/src/config.ts) | TypeScript | -36 | 0 | -4 | -40 |
| [backend/src/controllers/AuthController.ts](/backend/src/controllers/AuthController.ts) | TypeScript | -133 | -1 | -14 | -148 |
| [backend/src/controllers/ChatController.ts](/backend/src/controllers/ChatController.ts) | TypeScript | -192 | 0 | -26 | -218 |
| [backend/src/controllers/DeviceController.ts](/backend/src/controllers/DeviceController.ts) | TypeScript | -27 | 0 | -6 | -33 |
| [backend/src/controllers/HistoryController.ts](/backend/src/controllers/HistoryController.ts) | TypeScript | -11 | 0 | -4 | -15 |
| [backend/src/controllers/LoanController.ts](/backend/src/controllers/LoanController.ts) | TypeScript | -35 | 0 | -7 | -42 |
| [backend/src/controllers/MfaController.ts](/backend/src/controllers/MfaController.ts) | TypeScript | -74 | -5 | -10 | -89 |
| [backend/src/controllers/ReservationController.ts](/backend/src/controllers/ReservationController.ts) | TypeScript | -128 | 0 | -20 | -148 |
| [backend/src/controllers/RoomController.ts](/backend/src/controllers/RoomController.ts) | TypeScript | -18 | 0 | -5 | -23 |
| [backend/src/controllers/UserController.ts](/backend/src/controllers/UserController.ts) | TypeScript | -27 | 0 | -5 | -32 |
| [backend/src/database.ts](/backend/src/database.ts) | TypeScript | -72 | 0 | -7 | -79 |
| [backend/src/index.ts](/backend/src/index.ts) | TypeScript | -46 | -5 | -5 | -56 |
| [backend/src/middleware/auditLog.ts](/backend/src/middleware/auditLog.ts) | TypeScript | -37 | -2 | -9 | -48 |
| [backend/src/middleware/authenticate.ts](/backend/src/middleware/authenticate.ts) | TypeScript | -33 | 0 | -2 | -35 |
| [backend/src/middleware/requireAdmin.ts](/backend/src/middleware/requireAdmin.ts) | TypeScript | -12 | 0 | -2 | -14 |
| [backend/src/repositories/DeviceRepository.ts](/backend/src/repositories/DeviceRepository.ts) | TypeScript | -8 | 0 | -3 | -11 |
| [backend/src/repositories/HistoryRepository.ts](/backend/src/repositories/HistoryRepository.ts) | TypeScript | -16 | 0 | -3 | -19 |
| [backend/src/repositories/JsonRepository.ts](/backend/src/repositories/JsonRepository.ts) | TypeScript | -78 | -2 | -15 | -95 |
| [backend/src/repositories/LoanRepository.ts](/backend/src/repositories/LoanRepository.ts) | TypeScript | -8 | 0 | -3 | -11 |
| [backend/src/repositories/ReservationRepository.ts](/backend/src/repositories/ReservationRepository.ts) | TypeScript | -8 | 0 | -3 | -11 |
| [backend/src/repositories/RoomRepository.ts](/backend/src/repositories/RoomRepository.ts) | TypeScript | -8 | 0 | -3 | -11 |
| [backend/src/repositories/SqliteRepository.ts](/backend/src/repositories/SqliteRepository.ts) | TypeScript | -69 | 0 | -11 | -80 |
| [backend/src/repositories/UserRepository.ts](/backend/src/repositories/UserRepository.ts) | TypeScript | -19 | 0 | -6 | -25 |
| [backend/src/routes/authRoutes.ts](/backend/src/routes/authRoutes.ts) | TypeScript | -27 | 0 | -6 | -33 |
| [backend/src/routes/chatRoutes.ts](/backend/src/routes/chatRoutes.ts) | TypeScript | -6 | 0 | -4 | -10 |
| [backend/src/routes/deviceRoutes.ts](/backend/src/routes/deviceRoutes.ts) | TypeScript | -10 | 0 | -4 | -14 |
| [backend/src/routes/historyRoutes.ts](/backend/src/routes/historyRoutes.ts) | TypeScript | -11 | 0 | -4 | -15 |
| [backend/src/routes/loanRoutes.ts](/backend/src/routes/loanRoutes.ts) | TypeScript | -10 | 0 | -4 | -14 |
| [backend/src/routes/mfaRoutes.ts](/backend/src/routes/mfaRoutes.ts) | TypeScript | -10 | 0 | -4 | -14 |
| [backend/src/routes/reservationRoutes.ts](/backend/src/routes/reservationRoutes.ts) | TypeScript | -10 | 0 | -4 | -14 |
| [backend/src/routes/roomRoutes.ts](/backend/src/routes/roomRoutes.ts) | TypeScript | -9 | 0 | -4 | -13 |
| [backend/src/routes/userRoutes.ts](/backend/src/routes/userRoutes.ts) | TypeScript | -9 | 0 | -4 | -13 |
| [backend/src/services/AuthService.ts](/backend/src/services/AuthService.ts) | TypeScript | -82 | -1 | -15 | -98 |
| [backend/src/services/CryptoService.ts](/backend/src/services/CryptoService.ts) | TypeScript | -46 | 0 | -7 | -53 |
| [backend/src/services/DeviceService.ts](/backend/src/services/DeviceService.ts) | TypeScript | -19 | 0 | -6 | -25 |
| [backend/src/services/LoanService.ts](/backend/src/services/LoanService.ts) | TypeScript | -70 | 0 | -12 | -82 |
| [backend/src/services/MfaService.ts](/backend/src/services/MfaService.ts) | TypeScript | -29 | 0 | -7 | -36 |
| [backend/src/services/PasswordResetService.ts](/backend/src/services/PasswordResetService.ts) | TypeScript | -79 | -3 | -14 | -96 |
| [backend/src/services/ReservationService.ts](/backend/src/services/ReservationService.ts) | TypeScript | -231 | -3 | -27 | -261 |
| [backend/src/services/RoomService.ts](/backend/src/services/RoomService.ts) | TypeScript | -16 | 0 | -5 | -21 |
| [backend/src/services/UserService.ts](/backend/src/services/UserService.ts) | TypeScript | -40 | 0 | -7 | -47 |
| [backend/src/types.ts](/backend/src/types.ts) | TypeScript | -105 | -6 | -11 | -122 |
| [frontend/src/App.css](/frontend/src/App.css) | PostCSS | 3 | 2 | 2 | 7 |
| [frontend/src/App.tsx](/frontend/src/App.tsx) | TypeScript JSX | 91 | 0 | 3 | 94 |
| [frontend/src/api.ts](/frontend/src/api.ts) | TypeScript | 124 | 0 | 10 | 134 |
| [frontend/src/components/ChatPanel.tsx](/frontend/src/components/ChatPanel.tsx) | TypeScript JSX | 234 | 7 | 33 | 274 |
| [frontend/src/components/DayTimeline.tsx](/frontend/src/components/DayTimeline.tsx) | TypeScript JSX | 99 | 3 | 13 | 115 |
| [frontend/src/components/Layout.tsx](/frontend/src/components/Layout.tsx) | TypeScript JSX | 172 | 8 | 22 | 202 |
| [frontend/src/components/NotificationBell.tsx](/frontend/src/components/NotificationBell.tsx) | TypeScript JSX | 184 | 0 | 22 | 206 |
| [frontend/src/components/ProtectedRoute.tsx](/frontend/src/components/ProtectedRoute.tsx) | TypeScript JSX | 34 | 0 | 8 | 42 |
| [frontend/src/components/RoomReserveDialog.tsx](/frontend/src/components/RoomReserveDialog.tsx) | TypeScript JSX | 945 | 1 | 54 | 1,000 |
| [frontend/src/components/SortableHead.tsx](/frontend/src/components/SortableHead.tsx) | TypeScript JSX | 43 | 0 | 4 | 47 |
| [frontend/src/components/ui/alert-dialog.tsx](/frontend/src/components/ui/alert-dialog.tsx) | TypeScript JSX | 171 | 0 | 15 | 186 |
| [frontend/src/components/ui/alert.tsx](/frontend/src/components/ui/alert.tsx) | TypeScript JSX | 69 | 0 | 8 | 77 |
| [frontend/src/components/ui/badge.tsx](/frontend/src/components/ui/badge.tsx) | TypeScript JSX | 48 | 0 | 5 | 53 |
| [frontend/src/components/ui/button.tsx](/frontend/src/components/ui/button.tsx) | TypeScript JSX | 54 | 0 | 5 | 59 |
| [frontend/src/components/ui/card.tsx](/frontend/src/components/ui/card.tsx) | TypeScript JSX | 94 | 0 | 10 | 104 |
| [frontend/src/components/ui/checkbox.tsx](/frontend/src/components/ui/checkbox.tsx) | TypeScript JSX | 25 | 0 | 5 | 30 |
| [frontend/src/components/ui/dialog.tsx](/frontend/src/components/ui/dialog.tsx) | TypeScript JSX | 147 | 0 | 14 | 161 |
| [frontend/src/components/ui/input.tsx](/frontend/src/components/ui/input.tsx) | TypeScript JSX | 17 | 0 | 4 | 21 |
| [frontend/src/components/ui/label.tsx](/frontend/src/components/ui/label.tsx) | TypeScript JSX | 15 | 0 | 4 | 19 |
| [frontend/src/components/ui/popover.tsx](/frontend/src/components/ui/popover.tsx) | TypeScript JSX | 81 | 0 | 10 | 91 |
| [frontend/src/components/ui/radio-group.tsx](/frontend/src/components/ui/radio-group.tsx) | TypeScript JSX | 32 | 0 | 5 | 37 |
| [frontend/src/components/ui/select.tsx](/frontend/src/components/ui/select.tsx) | TypeScript JSX | 187 | 0 | 13 | 200 |
| [frontend/src/components/ui/separator.tsx](/frontend/src/components/ui/separator.tsx) | TypeScript JSX | 20 | 0 | 4 | 24 |
| [frontend/src/components/ui/table.tsx](/frontend/src/components/ui/table.tsx) | TypeScript JSX | 105 | 0 | 12 | 117 |
| [frontend/src/components/ui/textarea.tsx](/frontend/src/components/ui/textarea.tsx) | TypeScript JSX | 15 | 0 | 4 | 19 |
| [frontend/src/constants.ts](/frontend/src/constants.ts) | TypeScript | 1 | 0 | 1 | 2 |
| [frontend/src/contexts/AuthContext.tsx](/frontend/src/contexts/AuthContext.tsx) | TypeScript JSX | 120 | 5 | 15 | 140 |
| [frontend/src/contexts/DataContext.tsx](/frontend/src/contexts/DataContext.tsx) | TypeScript JSX | 211 | 5 | 29 | 245 |
| [frontend/src/contexts/DialogContext.tsx](/frontend/src/contexts/DialogContext.tsx) | TypeScript JSX | 187 | 0 | 18 | 205 |
| [frontend/src/hooks/useSortFilter.ts](/frontend/src/hooks/useSortFilter.ts) | TypeScript | 51 | 1 | 12 | 64 |
| [frontend/src/index.css](/frontend/src/index.css) | PostCSS | 125 | 0 | 5 | 130 |
| [frontend/src/index.tsx](/frontend/src/index.tsx) | TypeScript JSX | 12 | 0 | 2 | 14 |
| [frontend/src/lib/utils.ts](/frontend/src/lib/utils.ts) | TypeScript | 5 | 0 | 2 | 7 |
| [frontend/src/logo.svg](/frontend/src/logo.svg) | XML | 1 | 0 | 0 | 1 |
| [frontend/src/pages/DashboardPage.tsx](/frontend/src/pages/DashboardPage.tsx) | TypeScript JSX | 383 | 13 | 41 | 437 |
| [frontend/src/pages/DeviceListPage.tsx](/frontend/src/pages/DeviceListPage.tsx) | TypeScript JSX | 372 | 1 | 21 | 394 |
| [frontend/src/pages/DeviceRegisterPage.tsx](/frontend/src/pages/DeviceRegisterPage.tsx) | TypeScript JSX | 96 | 0 | 12 | 108 |
| [frontend/src/pages/ForgotPasswordPage.tsx](/frontend/src/pages/ForgotPasswordPage.tsx) | TypeScript JSX | 86 | 0 | 5 | 91 |
| [frontend/src/pages/LoginPage.tsx](/frontend/src/pages/LoginPage.tsx) | TypeScript JSX | 134 | 0 | 8 | 142 |
| [frontend/src/pages/MfaSetupPage.tsx](/frontend/src/pages/MfaSetupPage.tsx) | TypeScript JSX | 277 | 0 | 23 | 300 |
| [frontend/src/pages/ReservationListPage.tsx](/frontend/src/pages/ReservationListPage.tsx) | TypeScript JSX | 235 | 1 | 15 | 251 |
| [frontend/src/pages/ResetPasswordPage.tsx](/frontend/src/pages/ResetPasswordPage.tsx) | TypeScript JSX | 93 | 0 | 7 | 100 |
| [frontend/src/pages/RoomListPage.tsx](/frontend/src/pages/RoomListPage.tsx) | TypeScript JSX | 153 | 1 | 11 | 165 |
| [frontend/src/pages/RoomRegisterPage.tsx](/frontend/src/pages/RoomRegisterPage.tsx) | TypeScript JSX | 76 | 0 | 11 | 87 |
| [frontend/src/pages/RoomReservePage.tsx](/frontend/src/pages/RoomReservePage.tsx) | TypeScript JSX | 527 | 3 | 53 | 583 |
| [frontend/src/pages/UserListPage.tsx](/frontend/src/pages/UserListPage.tsx) | TypeScript JSX | 129 | 1 | 9 | 139 |
| [frontend/src/pages/UserRegisterPage.tsx](/frontend/src/pages/UserRegisterPage.tsx) | TypeScript JSX | 82 | 0 | 11 | 93 |
| [frontend/src/react-app-env.d.ts](/frontend/src/react-app-env.d.ts) | TypeScript | 0 | 1 | 1 | 2 |
| [frontend/src/setupTests.ts](/frontend/src/setupTests.ts) | TypeScript | 1 | 4 | 1 | 6 |
| [frontend/src/types.ts](/frontend/src/types.ts) | TypeScript | 92 | 0 | 13 | 105 |
| [frontend/src/utils/loanAlerts.ts](/frontend/src/utils/loanAlerts.ts) | TypeScript | 43 | 0 | 8 | 51 |

[Summary](results.md) / [Details](details.md) / [Diff Summary](diff.md) / Diff Details