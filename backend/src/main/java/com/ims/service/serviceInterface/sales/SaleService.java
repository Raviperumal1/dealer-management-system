package com.ims.service.serviceInterface.sales;

import com.ims.common.PageResponse;
import com.ims.dtos.sales.*;
import com.ims.enums.SaleStatus;
import com.ims.enums.SaleType;
import org.springframework.data.domain.Pageable;

public interface SaleService {
    SaleResponse confirmSale(SaleCreateRequest request, String username);
    PaymentResponse recordPayment(Long saleId, PaymentCreateRequest request, String username);
    SaleResponse getSaleById(Long id);
    PageResponse<SaleResponse> getAllSales(SaleType saleType, SaleStatus status, Pageable pageable);
    DeliveryResponse deliverVehicle(Long saleId, DeliveryCreateRequest request, String username);
    DeliveryResponse getDeliveryBySaleId(Long saleId);
}
