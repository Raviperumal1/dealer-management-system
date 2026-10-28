package com.ims.repository.finance;

import com.ims.entity.finance.FinanceLenderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FinanceLenderRepository extends JpaRepository<FinanceLenderEntity, Long>, JpaSpecificationExecutor<FinanceLenderEntity> {
    Optional<FinanceLenderEntity> findByLenderCode(String lenderCode);
    List<FinanceLenderEntity> findByIsActiveTrueOrderByNameAsc();
}
