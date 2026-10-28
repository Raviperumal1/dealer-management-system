package com.ims.dtos.role;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuResponse {

    private Long id;
    private String code;
    private String name;
    private String route;
    private String icon;
    private Integer orderIndex;
    private boolean active;
}
