package com.ims.service.impl.auth;

import com.ims.dtos.auth.*;
import com.ims.dtos.user.UserProfileResponse;
import com.ims.entity.security.*;
import com.ims.exception.BusinessRuleViolationException;
import com.ims.exception.ResourceNotFoundException;
import com.ims.exception.UnauthorizedOperationException;
import com.ims.repository.security.*;
import com.ims.security.authentication.CustomUserDetails;
import com.ims.security.jwt.JwtService;
import com.ims.service.serviceInterface.auth.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final RoleMenuPermissionRepository permissionRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.jwt.expiration-ms:86400000}")
    private long jwtExpirationMs;

    @Value("${app.jwt.refresh-expiration-ms:604800000}")
    private long refreshExpirationMs;

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        UserEntity user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.isActive()) {
            throw new UnauthorizedOperationException("User account is inactive. Please contact system administrator.");
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        String accessToken = jwtService.generateToken(userDetails);
        String refreshToken = createAndSaveRefreshToken(user);

        List<String> roles = user.getRoles().stream()
                .map(RoleEntity::getName)
                .collect(Collectors.toList());

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtExpirationMs / 1000)
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .roles(roles)
                .build();
    }

    @Override
    @Transactional
    public LoginResponse refreshToken(RefreshTokenRequest request) {
        String tokenHash = request.getRefreshToken();
        RefreshTokenEntity refreshTokenEntity = refreshTokenRepository.findByTokenHashAndRevokedFalse(tokenHash)
                .orElseThrow(() -> new UnauthorizedOperationException("Invalid or revoked refresh token"));

        if (refreshTokenEntity.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenEntity.setRevoked(true);
            refreshTokenEntity.setRevokedAt(Instant.now());
            refreshTokenRepository.save(refreshTokenEntity);
            throw new UnauthorizedOperationException("Refresh token has expired");
        }

        UserEntity user = refreshTokenEntity.getUser();
        if (!user.isActive()) {
            throw new UnauthorizedOperationException("User account is deactivated");
        }

        // Token rotation: revoke old token and issue a fresh one
        refreshTokenEntity.setRevoked(true);
        refreshTokenEntity.setRevokedAt(Instant.now());
        refreshTokenRepository.save(refreshTokenEntity);

        String newRefreshToken = createAndSaveRefreshToken(user);
        CustomUserDetails userDetails = new CustomUserDetails(user);
        String newAccessToken = jwtService.generateToken(userDetails);

        List<String> roles = user.getRoles().stream()
                .map(RoleEntity::getName)
                .collect(Collectors.toList());

        return LoginResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtExpirationMs / 1000)
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .roles(roles)
                .build();
    }

    @Override
    @Transactional
    public void logout(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                String username = jwtService.extractUsername(token);
                userRepository.findByUsername(username).ifPresent(user -> {
                    refreshTokenRepository.revokeAllUserTokens(user.getId(), Instant.now());
                });
            } catch (Exception e) {
                log.warn("Failed to extract username during logout: {}", e.getMessage());
            }
        }
    }

    @Override
    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BusinessRuleViolationException("Current password does not match");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        refreshTokenRepository.revokeAllUserTokens(user.getId(), Instant.now());
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        Optional<UserEntity> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isPresent()) {
            UserEntity user = userOpt.get();
            String token = UUID.randomUUID().toString();
            PasswordResetTokenEntity resetToken = PasswordResetTokenEntity.builder()
                    .user(user)
                    .token(token)
                    .expiryDate(Instant.now().plus(2, ChronoUnit.HOURS))
                    .used(false)
                    .build();
            passwordResetTokenRepository.save(resetToken);
            log.info("Password reset token generated for user [{}]: {}", user.getUsername(), token);
        }
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetTokenEntity resetToken = passwordResetTokenRepository.findByTokenAndUsedFalse(request.getToken())
                .orElseThrow(() -> new BusinessRuleViolationException("Invalid or already used password reset token"));

        if (resetToken.getExpiryDate().isBefore(Instant.now())) {
            throw new BusinessRuleViolationException("Password reset token has expired");
        }

        UserEntity user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        refreshTokenRepository.revokeAllUserTokens(user.getId(), Instant.now());
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile(String username) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Set<String> roleNames = user.getRoles().stream()
                .map(RoleEntity::getName)
                .collect(Collectors.toSet());

        List<RoleMenuPermissionEntity> permissions = permissionRepository.findByRoleNames(roleNames);

        Map<String, UserProfileResponse.MenuPermissionDto> menuMap = new HashMap<>();
        for (RoleMenuPermissionEntity p : permissions) {
            if (p.getMenu() != null) {
                String code = p.getMenu().getCode();
                UserProfileResponse.MenuPermissionDto dto = menuMap.computeIfAbsent(code, k ->
                        UserProfileResponse.MenuPermissionDto.builder()
                                .menuCode(p.getMenu().getCode())
                                .menuName(p.getMenu().getName())
                                .route(p.getMenu().getRoute())
                                .icon(p.getMenu().getIcon())
                                .build()
                );
                dto.setCanView(dto.isCanView() || p.isCanView());
                dto.setCanAdd(dto.isCanAdd() || p.isCanAdd());
                dto.setCanEdit(dto.isCanEdit() || p.isCanEdit());
                dto.setCanDelete(dto.isCanDelete() || p.isCanDelete());
                dto.setCanPay(dto.isCanPay() || p.isCanPay());
                dto.setCanExport(dto.isCanExport() || p.isCanExport());
                dto.setCanChangeStatus(dto.isCanChangeStatus() || p.isCanChangeStatus());
            }
        }

        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .roles(roleNames)
                .permissions(new ArrayList<>(menuMap.values()))
                .build();
    }

    private String createAndSaveRefreshToken(UserEntity user) {
        String token = UUID.randomUUID().toString() + "-" + UUID.randomUUID().toString();
        RefreshTokenEntity entity = RefreshTokenEntity.builder()
                .user(user)
                .tokenHash(token)
                .expiryDate(Instant.now().plusMillis(refreshExpirationMs))
                .revoked(false)
                .build();
        refreshTokenRepository.save(entity);
        return token;
    }
}
