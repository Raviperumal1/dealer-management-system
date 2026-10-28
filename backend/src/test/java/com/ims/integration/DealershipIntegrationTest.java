package com.ims.integration;

import com.ims.dtos.auth.LoginRequest;
import com.ims.dtos.auth.LoginResponse;
import com.ims.dtos.customer.CustomerCreateRequest;
import com.ims.dtos.customer.CustomerResponse;
import com.ims.dtos.vehicle.VehicleCreateRequest;
import com.ims.dtos.vehicle.VehicleResponse;
import com.ims.entity.security.RoleEntity;
import com.ims.entity.security.UserEntity;
import com.ims.enums.FuelType;
import com.ims.enums.OwnershipType;
import com.ims.enums.TransmissionType;
import com.ims.enums.VehicleType;
import com.ims.repository.security.RoleRepository;
import com.ims.repository.security.UserRepository;
import com.ims.service.serviceInterface.auth.AuthService;
import com.ims.service.serviceInterface.sales.CustomerService;
import com.ims.service.serviceInterface.vehicle.VehicleService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DealershipIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private VehicleService vehicleService;

    @Autowired
    private CustomerService customerService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    @DisplayName("Context Loads & Admin Authentication Integration")
    void testAuthenticationIntegration() {
        RoleEntity adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseGet(() -> roleRepository.save(RoleEntity.builder().name("ROLE_ADMIN").description("Administrator").build()));

        if (!userRepository.existsByUsername("testadmin")) {
            UserEntity user = UserEntity.builder()
                    .username("testadmin")
                    .passwordHash(passwordEncoder.encode("TestPassword123!"))
                    .fullName("Test Administrator")
                    .email("testadmin@dealership.com")
                    .active(true)
                    .roles(new HashSet<>(Set.of(adminRole)))
                    .build();
            userRepository.save(user);
        }

        LoginRequest loginRequest = LoginRequest.builder()
                .username("testadmin")
                .password("TestPassword123!")
                .build();

        LoginResponse loginResponse = authService.login(loginRequest);

        assertNotNull(loginResponse);
        assertNotNull(loginResponse.getAccessToken());
        assertEquals("testadmin", loginResponse.getUsername());
        assertTrue(loginResponse.getRoles().contains("ROLE_ADMIN"));
    }

    @Test
    @DisplayName("Vehicle Creation & Customer Registration Integration")
    void testVehicleAndCustomerCreation() {
        // 1. Create Customer
        CustomerCreateRequest custReq = CustomerCreateRequest.builder()
                .name("Suresh Raina")
                .mobile("9876543299")
                .email("suresh.raina@example.com")
                .address("45 MG Road, Bangalore")
                .idProofType("AADHAAR")
                .idProofNumber("1234-5678-9012")
                .build();

        CustomerResponse customer = customerService.createCustomer(custReq);
        assertNotNull(customer);
        assertEquals("Suresh Raina", customer.getName());

        // 2. Register Own Vehicle
        VehicleCreateRequest vehReq = VehicleCreateRequest.builder()
                .registrationNumber("KA05MB9999")
                .vehicleType(VehicleType.CAR)
                .brand("Tata")
                .model("Nexon")
                .variant("XZ Plus")
                .manufacturingYear(2023)
                .registrationYear(2023)
                .fuelType(FuelType.PETROL)
                .transmission(TransmissionType.MANUAL)
                .color("Daytona Grey")
                .odometerReading(12000)
                .chassisNumber("MAT1234567890NX01")
                .engineNumber("ENG9876543210NX01")
                .rcNumber("RC-KA05MB9999")
                .insurancePolicyNumber("INS-POL-2026-99")
                .insuranceValidityDate(LocalDate.now().plusMonths(10))
                .ownershipType(OwnershipType.OWN)
                .purchaseDate(LocalDate.now())
                .purchasePrice(BigDecimal.valueOf(850000.00))
                .purchaseExpenses(BigDecimal.valueOf(15000.00))
                .sellerName("Rahul Sharma")
                .sellerPhone("9845098450")
                .build();

        VehicleResponse vehicle = vehicleService.createVehicle(vehReq, "testadmin");
        assertNotNull(vehicle);
        assertEquals("KA05MB9999", vehicle.getRegistrationNumber());
        assertEquals(OwnershipType.OWN, vehicle.getOwnershipType());

        // 3. Test Vehicle Photo Upload and Primary Selection Workflow
        org.springframework.mock.web.MockMultipartFile photo1 = new org.springframework.mock.web.MockMultipartFile(
                "file", "front_view.jpg", "image/jpeg", "image-content-bytes-1".getBytes()
        );
        VehicleResponse withPhoto1 = vehicleService.uploadPhoto(vehicle.getId(), photo1, "Front Showroom View", true);
        assertNotNull(withPhoto1.getPhotos());
        assertFalse(withPhoto1.getPhotos().isEmpty());
        assertTrue(withPhoto1.getPhotos().get(0).isPrimary());
        assertNotNull(withPhoto1.getPrimaryPhotoUrl());

        org.springframework.mock.web.MockMultipartFile photo2 = new org.springframework.mock.web.MockMultipartFile(
                "file", "rear_view.png", "image/png", "image-content-bytes-2".getBytes()
        );
        VehicleResponse withPhoto2 = vehicleService.uploadPhoto(vehicle.getId(), photo2, "Rear Tail View", false);
        assertEquals(2, withPhoto2.getPhotos().size());

        // Switch primary photo to photo2
        Long photo2Id = withPhoto2.getPhotos().get(1).getId();
        VehicleResponse withSwitchedPrimary = vehicleService.setPrimaryPhoto(vehicle.getId(), photo2Id);
        VehicleResponse.PhotoDto p2 = withSwitchedPrimary.getPhotos().stream().filter(p -> p.getId().equals(photo2Id)).findFirst().orElseThrow();
        assertTrue(p2.isPrimary());

        // 4. Test Vehicle Document Upload Workflow (RC / Insurance)
        org.springframework.mock.web.MockMultipartFile docFile = new org.springframework.mock.web.MockMultipartFile(
                "file", "rc_document.pdf", "application/pdf", "pdf-document-bytes".getBytes()
        );
        VehicleResponse withDoc = vehicleService.uploadDocument(vehicle.getId(), docFile, "RC", "RC Smartcard Copy");
        assertNotNull(withDoc.getDocuments());
        assertFalse(withDoc.getDocuments().isEmpty());
        assertEquals("RC", withDoc.getDocuments().get(0).getDocumentType());

        // 5. Test Photo Deletion
        VehicleResponse afterDelete = vehicleService.deletePhoto(vehicle.getId(), withPhoto1.getPhotos().get(0).getId());
        assertEquals(1, afterDelete.getPhotos().size());
    }
}
