const fs = require('fs');
const path = require('path');
const http = require('http');

const API_DOCS_URL = 'http://localhost:8081/api/v1.0/v3/api-docs';
const OUTPUT_DIR = path.join(__dirname, 'postman');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function resolveSchema(schema, components) {
  if (!schema) return {};
  if (schema.$ref) {
    const refKey = schema.$ref.replace('#/components/schemas/', '');
    return components.schemas[refKey] || {};
  }
  return schema;
}

function generateSampleFromSchema(schema, components, depth = 0) {
  if (depth > 4 || !schema) return null;
  schema = resolveSchema(schema, components);

  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;

  if (schema.type === 'string') {
    if (schema.enum && schema.enum.length > 0) return schema.enum[0];
    if (schema.format === 'date') return '2026-10-13';
    if (schema.format === 'date-time') return '2026-10-13T10:00:00Z';
    return 'Sample Text';
  }
  if (schema.type === 'integer' || schema.type === 'number') {
    return 1;
  }
  if (schema.type === 'boolean') {
    return true;
  }
  if (schema.type === 'array') {
    const itemSample = generateSampleFromSchema(schema.items, components, depth + 1);
    return itemSample !== null ? [itemSample] : [];
  }
  if (schema.type === 'object' || schema.properties) {
    const obj = {};
    const props = schema.properties || {};
    for (const [key, propSchema] of Object.entries(props)) {
      obj[key] = generateSampleFromSchema(propSchema, components, depth + 1);
    }
    return obj;
  }
  return {};
}

async function generate() {
  console.log(`Fetching OpenAPI definitions from ${API_DOCS_URL}...`);
  const openapi = await fetchJson(API_DOCS_URL);
  console.log(`Loaded OpenAPI specs: ${openapi.info.title} (${openapi.info.version})`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Tag descriptions / module ordering
  const tagOrder = [
    'Authentication',
    'Dashboard',
    'Vehicle Management',
    'Broker Management',
    'Settlement Management',
    'Customer Management',
    'Inspection Management',
    'Workshop & Job Cards',
    'Inventory - Spare Parts',
    'Inventory - Purchase Invoices',
    'Inventory - Stock Movements',
    'Supplier Management',
    'Sales Management',
    'Booking Management',
    'Finance & EMI Management',
    'Costing & Profitability',
    'Operational Expenses',
    'Reports & Analytics',
    'User Management',
    'Role & RBAC Management',
    'Menu & Permissions',
    'Document Management'
  ];

  const foldersMap = {};
  for (const tag of tagOrder) {
    foldersMap[tag] = {
      name: tag,
      item: []
    };
  }

  const components = openapi.components || { schemas: {} };
  const paths = openapi.paths || {};

  for (const [routePath, methods] of Object.entries(paths)) {
    for (const [method, op] of Object.entries(methods)) {
      const upperMethod = method.toUpperCase();
      const tagName = (op.tags && op.tags[0]) || 'General';
      if (!foldersMap[tagName]) {
        foldersMap[tagName] = {
          name: tagName,
          item: []
        };
      }

      // Convert path params /users/{id} to /users/:id
      const postmanPath = routePath.split('/').filter(Boolean).map(segment => {
        if (segment.startsWith('{') && segment.endsWith('}')) {
          return ':' + segment.slice(1, -1);
        }
        return segment;
      });

      const urlVariables = [];
      if (op.parameters) {
        for (const p of op.parameters) {
          if (p.in === 'path') {
            urlVariables.push({
              key: p.name,
              value: p.name.toLowerCase().includes('id') ? '1' : 'test',
              description: p.description || ''
            });
          }
        }
      }

      const queryParams = [];
      if (op.parameters) {
        for (const p of op.parameters) {
          if (p.in === 'query') {
            let val = '';
            if (p.schema) {
              const res = resolveSchema(p.schema, components);
              if (res.default !== undefined) val = String(res.default);
              else if (res.enum && res.enum.length > 0) val = String(res.enum[0]);
              else if (res.type === 'integer') val = '1';
            }
            queryParams.push({
              key: p.name,
              value: val,
              description: p.description || '',
              disabled: !p.required && val === ''
            });
          }
        }
      }

      let requestBody = undefined;
      if (op.requestBody && op.requestBody.content) {
        const jsonContent = op.requestBody.content['application/json'];
        const formContent = op.requestBody.content['multipart/form-data'];

        if (jsonContent && jsonContent.schema) {
          const sample = generateSampleFromSchema(jsonContent.schema, components);
          // Customize realistic sample for login
          if (routePath.includes('/auth/login')) {
            sample.username = 'admin';
            sample.password = 'admin123';
            delete sample.usernameOrEmail;
          }
          requestBody = {
            mode: 'raw',
            raw: JSON.stringify(sample, null, 2),
            options: {
              raw: {
                language: 'json'
              }
            }
          };
        } else if (formContent) {
          requestBody = {
            mode: 'formdata',
            formdata: [
              {
                key: 'file',
                type: 'file',
                src: []
              }
            ]
          };
        }
      }

      const headers = [
        {
          key: 'Accept',
          value: 'application/json'
        }
      ];

      // Add auth header unless public endpoint
      const isPublic = routePath.includes('/auth/login') ||
                       routePath.includes('/auth/refresh') ||
                       routePath.includes('/auth/forgot-password') ||
                       routePath.includes('/auth/reset-password');

      let authConfig = undefined;
      if (!isPublic) {
        authConfig = {
          type: 'bearer',
          bearer: [
            {
              key: 'token',
              value: '{{authToken}}',
              type: 'string'
            }
          ]
        };
      } else {
        authConfig = {
          type: 'noauth'
        };
      }

      const item = {
        name: op.summary || `${upperMethod} ${routePath}`,
        request: {
          method: upperMethod,
          header: headers,
          url: {
            raw: '{{baseUrl}}' + routePath + (queryParams.filter(q => !q.disabled).length > 0 ? '?' + queryParams.filter(q => !q.disabled).map(q => `${q.key}=${q.value}`).join('&') : ''),
            host: ['{{baseUrl}}'],
            path: postmanPath,
            query: queryParams.length > 0 ? queryParams : undefined,
            variable: urlVariables.length > 0 ? urlVariables : undefined
          },
          description: op.description || op.summary || ''
        }
      };

      if (authConfig) {
        item.request.auth = authConfig;
      }
      if (requestBody) {
        item.request.body = requestBody;
      }

      // Add test script to Login request to automatically save authToken variable
      if (routePath.includes('/auth/login') && upperMethod === 'POST') {
        item.event = [
          {
            listen: 'test',
            script: {
              type: 'text/javascript',
              exec: [
                'if (pm.response.code === 200) {',
                '    var jsonData = pm.response.json();',
                '    var token = (jsonData.data && jsonData.data.accessToken) || jsonData.accessToken;',
                '    if (token) {',
                '        pm.environment.set("authToken", token);',
                '        pm.collectionVariables.set("authToken", token);',
                '        console.log("Successfully updated authToken in Postman environment!");',
                '    }',
                '}'
              ]
            }
          }
        ];
      }

      foldersMap[tagName].item.push(item);
    }
  }

  // Filter out empty folders
  const items = [];
  for (const [name, folder] of Object.entries(foldersMap)) {
    if (folder.item.length > 0) {
      items.push(folder);
    }
  }

  const collection = {
    info: {
      name: 'AutoManage Pro DMS - Complete REST API Collection',
      description: 'Comprehensive, production-ready Postman collection for AutoManage Pro DMS Spring Boot backend.\nIncludes automated JWT authentication capture, realistic payloads, query filters, and role-based endpoints.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    variable: [
      {
        key: 'baseUrl',
        value: 'http://localhost:8081/api/v1.0',
        type: 'string'
      },
      {
        key: 'authToken',
        value: '',
        type: 'string'
      }
    ],
    item: items
  };

  const collectionPath = path.join(OUTPUT_DIR, 'AutoManage_Pro_DMS.postman_collection.json');
  fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2), 'utf-8');
  console.log(`Generated collection at: ${collectionPath}`);

  const environment = {
    name: 'AutoManage Pro DMS - Local Environment',
    values: [
      {
        key: 'baseUrl',
        value: 'http://localhost:8081/api/v1.0',
        type: 'default',
        enabled: true
      },
      {
        key: 'authToken',
        value: '',
        type: 'secret',
        enabled: true
      },
      {
        key: 'adminUsername',
        value: 'admin',
        type: 'default',
        enabled: true
      },
      {
        key: 'adminPassword',
        value: 'admin123',
        type: 'secret',
        enabled: true
      }
    ]
  };

  const environmentPath = path.join(OUTPUT_DIR, 'AutoManage_Pro_DMS.postman_environment.json');
  fs.writeFileSync(environmentPath, JSON.stringify(environment, null, 2), 'utf-8');
  console.log(`Generated environment at: ${environmentPath}`);

  const readmeContent = `# AutoManage Pro DMS — Postman Collection & API Suite

This folder contains the complete, production-ready Postman collection and environment files for testing all REST endpoints of the **AutoManage Pro Dealership Management System (DMS)**.

## Files Included:
1. \`AutoManage_Pro_DMS.postman_collection.json\` — Complete API collection organized by feature module.
2. \`AutoManage_Pro_DMS.postman_environment.json\` — Local environment variables (\`baseUrl\`, \`authToken\`, \`adminUsername\`, \`adminPassword\`).

## Quick Setup Instructions:
1. Open **Postman**.
2. Click **Import** (top left).
3. Drag and drop both JSON files:
   - \`AutoManage_Pro_DMS.postman_collection.json\`
   - \`AutoManage_Pro_DMS.postman_environment.json\`
4. Select the **"AutoManage Pro DMS - Local Environment"** in the top-right environment selector.
5. In the collection, navigate to **Authentication -> Login with credentials** and click **Send**.
6. The test script will **automatically extract and store the JWT access token** into the \`{{authToken}}\` variable.
7. You can now execute any endpoint in any folder without manually copying or pasting tokens!

## API Modules Covered:
- **Authentication**: Login, Token Refresh, Logout, Change Password, Profile (/me)
- **Dashboard**: KPI Summary, Sales Trends, Fast-Moving Stock, Workshop Metrics
- **Vehicle Inventory**: CRUD for Cars & Bikes, Own Purchase vs Broker Consignment, Status Transitions, History
- **Brokers**: Registration, Listings, Performance Dashboard
- **Settlements**: Broker Payouts, Commissions, Remaining Balances, Installments
- **Customers**: CRM, Contact Profiles, Purchase History
- **Inspections**: Multi-point Condition Checks, Grading, Cost Estimates
- **Workshop**: Job Cards, Status Workflows, Spare Parts Consumption, Labour Charges
- **Spare Parts & Stock**: Inventory, SKU Tracking, Low Stock Alerts, Reorders
- **Purchase Invoices**: Vendor Invoicing, Stock Inward Movements
- **Suppliers**: Parts & Spare Vendors
- **Sales & Bookings**: Vehicle Bookings, Sale Closures, Delivery Handover
- **Finance**: Bank Tie-ups, Loans, EMI Schedule Tracking & Installment Repayments
- **Costing & Expenses**: Vehicle P&L, Shop Expenses, Cost Allocations
- **Reports**: Financial Reports, Broker Performance, Workshop Utilization, Excel & PDF exports
- **User & Roles**: RBAC Permissions, User Accounts, Menus
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'README.md'), readmeContent, 'utf-8');
  console.log('Postman setup README generated successfully.');
}

generate().catch(err => {
  console.error('Error generating postman collection:', err);
  process.exit(1);
});
