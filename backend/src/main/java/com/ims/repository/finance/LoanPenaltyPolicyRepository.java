package com.ims.repository.finance;

import com.ims.entity.finance.LoanPenaltyPolicyEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LoanPenaltyPolicyRepository extends JpaRepository<LoanPenaltyPolicyEntity, Long> {

    Optional<LoanPenaltyPolicyEntity> findByPolicyCode(String policyCode);

    Optional<LoanPenaltyPolicyEntity> findFirstByBorrowerCategoryAndInterestRateTypeAndIsActiveTrue(
            String borrowerCategory, String interestRateType
    );
}
