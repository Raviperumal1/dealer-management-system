package com.ims.service.serviceInterface.user;

import com.ims.common.PageResponse;
import com.ims.dtos.user.UserCreateRequest;
import com.ims.dtos.user.UserResponse;
import com.ims.dtos.user.UserUpdateRequest;
import org.springframework.data.domain.Pageable;

public interface UserService {
    UserResponse createUser(UserCreateRequest request);
    UserResponse getUserById(Long id);
    UserResponse updateUser(Long id, UserUpdateRequest request);
    void deactivateUser(Long id);
    void activateUser(Long id);
    PageResponse<UserResponse> getAllUsers(String search, Boolean active, Pageable pageable);
}
