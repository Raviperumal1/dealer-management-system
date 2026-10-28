package com.ims.service.impl.user;

import com.ims.common.PageResponse;
import com.ims.dtos.user.UserCreateRequest;
import com.ims.dtos.user.UserResponse;
import com.ims.dtos.user.UserUpdateRequest;
import com.ims.entity.security.RoleEntity;
import com.ims.entity.security.UserEntity;
import com.ims.exception.DuplicateResourceException;
import com.ims.exception.ResourceNotFoundException;
import com.ims.mapper.UserMapper;
import com.ims.repository.security.RoleRepository;
import com.ims.repository.security.UserRepository;
import com.ims.service.serviceInterface.user.UserService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public UserResponse createUser(UserCreateRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username '" + request.getUsername() + "' is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email '" + request.getEmail() + "' is already registered");
        }

        Set<RoleEntity> roles = resolveRoles(request.getRoles());

        UserEntity user = UserEntity.builder()
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .active(true)
                .roles(roles)
                .build();

        UserEntity savedUser = userRepository.save(user);
        return userMapper.toResponse(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return userMapper.toResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UserUpdateRequest request) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (!user.getEmail().equalsIgnoreCase(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email '" + request.getEmail() + "' is already registered to another user");
        }

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            user.setRoles(resolveRoles(request.getRoles()));
        }

        UserEntity updatedUser = userRepository.save(user);
        return userMapper.toResponse(updatedUser);
    }

    @Override
    @Transactional
    public void deactivateUser(Long id) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        user.setActive(false);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void activateUser(Long id) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        user.setActive(true);
        userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getAllUsers(String search, Boolean active, Pageable pageable) {
        Specification<UserEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }
            if (search != null && !search.trim().isEmpty()) {
                String searchLike = "%" + search.trim().toLowerCase() + "%";
                Predicate usernameLike = cb.like(cb.lower(root.get("username")), searchLike);
                Predicate fullNameLike = cb.like(cb.lower(root.get("fullName")), searchLike);
                Predicate emailLike = cb.like(cb.lower(root.get("email")), searchLike);
                predicates.add(cb.or(usernameLike, fullNameLike, emailLike));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<UserEntity> page = userRepository.findAll(spec, pageable);
        List<UserResponse> dtos = page.getContent().stream()
                .map(userMapper::toResponse)
                .collect(Collectors.toList());

        return PageResponse.of(page, dtos);
    }

    private Set<RoleEntity> resolveRoles(Set<String> roleNames) {
        Set<RoleEntity> roles = new HashSet<>();
        for (String roleName : roleNames) {
            String normalizedRole = roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName;
            RoleEntity role = roleRepository.findByName(normalizedRole)
                    .orElseGet(() -> roleRepository.findByName(roleName)
                            .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleName)));
            roles.add(role);
        }
        return roles;
    }
}
