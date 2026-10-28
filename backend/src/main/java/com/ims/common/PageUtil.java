package com.ims.common;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public final class PageUtil {

    private PageUtil() {}

    public static Pageable createPageable(int page, int size, String sortBy, String sortDirection) {
        int safePage = Math.max(page, 0);
        int safeSize = (size <= 0 || size > 100) ? 20 : size;
        Sort.Direction direction = "desc".equalsIgnoreCase(sortDirection) ? Sort.Direction.DESC : Sort.Direction.ASC;
        String safeSort = (sortBy == null || sortBy.trim().isEmpty()) ? "id" : sortBy.trim();

        return PageRequest.of(safePage, safeSize, Sort.by(direction, safeSort));
    }
}
