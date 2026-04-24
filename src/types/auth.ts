export interface AuthUser { userId: number; username: string; role: string; token: string; }
export interface LoginResponseApi { success: boolean; message: string; data: AuthUser; errors: string[] | null; }
