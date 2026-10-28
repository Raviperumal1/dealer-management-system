package com.ims.repository.sales;

import com.ims.entity.sales.CustomerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<CustomerEntity, Long>, JpaSpecificationExecutor<CustomerEntity> {
    Optional<CustomerEntity> findByMobile(String mobile);
    boolean existsByMobile(String mobile);
}
