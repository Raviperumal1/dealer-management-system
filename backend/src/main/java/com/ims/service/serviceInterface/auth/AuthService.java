package com.ims.service.serviceInterface.auth;

import com.ims.dtos.auth.*;
import com.ims.dtos.user.UserProfileResponse;

public interface AuthService {
    LoginResponse login(LoginRequest request);
    LoginResponse refreshToken(RefreshTokenRequest request);
    void logout(String authHeader);
    void changePassword(String username, ChangePasswordRequest request);
    void forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
    UserProfileResponse getCurrentUserProfile(String username);
}
