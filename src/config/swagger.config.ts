/**
 * Swagger/OpenAPI Documentation Configuration
 * API 文檔自動生成配置
 * 
 * @module SwaggerConfig
 * @version 1.0.0
 * @since 2025-08-25
 */

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export class SwaggerConfig {
  /**
   * 初始化 Swagger 文檔
   */
  static setupSwagger(app: INestApplication): void {
    // 基礎配置
    const config = new DocumentBuilder()
      .setTitle('菜蟲農食 ERP System API')
      .setDescription('Comprehensive ERP system API documentation for Tsaitung agricultural business')
      .setVersion('1.0.0')
      .addBearerAuth()
      .addTag('Authentication', '身份驗證相關 API')
      .addTag('Dashboard', '儀表板相關 API')
      .addTag('CRM', '客戶關係管理 API')
      .addTag('Orders', '訂單管理 API')
      .addTag('Inventory', '庫存管理 API')
      .addTag('Production', '生產管理 API')
      .addTag('Logistics', '物流管理 API')
      .addTag('Finance', '財務會計 API')
      .addTag('Reports', '報表分析 API')
      .addServer('http://localhost:3000', 'Development Server')
      .addServer('https://api.tsaitung.com', 'Production Server')
      .addServer('https://staging-api.tsaitung.com', 'Staging Server')
      .build();

    // 建立文檔
    const document = SwaggerModule.createDocument(app, config, {
      operationIdFactory: (
        controllerKey: string,
        methodKey: string
      ) => methodKey,
      deepScanRoutes: true,
    });

    // 設定 Swagger UI
    SwaggerModule.setup('api-docs', app, document, {
      customSiteTitle: '菜蟲農食 ERP API Documentation',
      customfavIcon: '/favicon.ico',
      customCss: `
        .swagger-ui .topbar { 
          background-color: #2e7d32;
        }
        .swagger-ui .topbar .download-url-wrapper { 
          display: none;
        }
      `,
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
        syntaxHighlight: {
          activate: true,
          theme: 'monokai'
        },
        tryItOutEnabled: true,
        requestSnippetsEnabled: true,
        requestSnippets: {
          generators: {
            'curl_bash': {
              title: 'cURL (bash)',
              syntax: 'bash'
            },
            'curl_powershell': {
              title: 'cURL (PowerShell)',
              syntax: 'powershell'
            },
            'curl_cmd': {
              title: 'cURL (CMD)',
              syntax: 'bash'
            },
            'node_native': {
              title: 'Node.js (Native)',
              syntax: 'javascript'
            },
            'node_axios': {
              title: 'Node.js (Axios)',
              syntax: 'javascript'
            },
            'python': {
              title: 'Python (Requests)',
              syntax: 'python'
            }
          }
        }
      }
    });

    // 匯出 OpenAPI 規範
    this.exportOpenAPISpec(document);

    // 生成 API 客戶端程式碼
    this.generateAPIClients(document);

    // 生成 Postman Collection
    this.generatePostmanCollection(document);
  }

  /**
   * 匯出 OpenAPI 規範到檔案
   */
  private static exportOpenAPISpec(document: any): void {
    const outputPath = path.join(process.cwd(), 'docs', 'api');
    
    // 確保目錄存在
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    // 匯出 JSON 格式
    fs.writeFileSync(
      path.join(outputPath, 'openapi.json'),
      JSON.stringify(document, null, 2)
    );

    // 匯出 YAML 格式
    const yaml = require('js-yaml');
    fs.writeFileSync(
      path.join(outputPath, 'openapi.yaml'),
      yaml.dump(document)
    );

    console.log(`✅ OpenAPI specification exported to ${outputPath}`);
  }

  /**
   * 生成 API 客戶端程式碼
   */
  private static generateAPIClients(document: any): void {
    // TypeScript 客戶端
    this.generateTypeScriptClient(document);
    
    // Python 客戶端
    this.generatePythonClient(document);
    
    // 生成 API Types
    this.generateAPITypes(document);
  }

  /**
   * 生成 TypeScript 客戶端
   */
  private static generateTypeScriptClient(document: any): void {
    const outputPath = path.join(process.cwd(), 'sdk', 'typescript');
    
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    // 生成 API 客戶端類別
    const clientCode = this.generateTypeScriptClientCode(document);
    fs.writeFileSync(
      path.join(outputPath, 'api-client.ts'),
      clientCode
    );

    // 生成型別定義
    const typesCode = this.generateTypeScriptTypes(document);
    fs.writeFileSync(
      path.join(outputPath, 'types.ts'),
      typesCode
    );

    console.log(`✅ TypeScript client generated at ${outputPath}`);
  }

  /**
   * 生成 TypeScript 客戶端程式碼
   */
  private static generateTypeScriptClientCode(document: any): string {
    const paths = document.paths || {};
    const methods: string[] = [];

    for (const [path, pathItem] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(pathItem as any)) {
        if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
          const operationId = operation.operationId || this.generateOperationId(path, method);
          const methodCode = this.generateMethodCode(path, method, operation, operationId);
          methods.push(methodCode);
        }
      }
    }

    return `
/**
 * Auto-generated API Client
 * Generated from OpenAPI specification
 * @generated
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { 
  ApiResponse,
  ${this.extractTypeNames(document).join(',\n  ')}
} from './types';

export class APIClient {
  private axios: AxiosInstance;

  constructor(baseURL: string = 'http://localhost:3000', config?: AxiosRequestConfig) {
    this.axios = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      ...config,
    });

    // Request interceptor for auth
    this.axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = \`Bearer \${token}\`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          localStorage.removeItem('access_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  ${methods.join('\n\n  ')}
}

export default APIClient;
`;
  }

  /**
   * 生成方法程式碼
   */
  private static generateMethodCode(
    path: string, 
    method: string, 
    operation: any, 
    operationId: string
  ): string {
    const parameters = operation.parameters || [];
    const requestBody = operation.requestBody;
    const responses = operation.responses || {};
    
    // 解析參數
    const pathParams = parameters.filter((p: any) => p.in === 'path');
    const queryParams = parameters.filter((p: any) => p.in === 'query');
    const hasBody = requestBody && ['post', 'put', 'patch'].includes(method);
    
    // 生成方法簽名
    const methodParams: string[] = [];
    
    pathParams.forEach((p: any) => {
      methodParams.push(`${p.name}: ${this.mapSchemaType(p.schema)}`);
    });
    
    if (queryParams.length > 0) {
      methodParams.push(`query?: { ${queryParams.map((p: any) => 
        `${p.name}${p.required ? '' : '?'}: ${this.mapSchemaType(p.schema)}`
      ).join('; ')} }`);
    }
    
    if (hasBody) {
      const bodyType = this.getRequestBodyType(requestBody);
      methodParams.push(`data: ${bodyType}`);
    }
    
    methodParams.push('config?: AxiosRequestConfig');
    
    // 生成回傳型別
    const responseType = this.getResponseType(responses['200'] || responses['201']);
    
    // 生成路徑
    let apiPath = path;
    pathParams.forEach((p: any) => {
      apiPath = apiPath.replace(`{${p.name}}`, `\${${p.name}}`);
    });
    
    return `/**
   * ${operation.summary || operationId}
   * ${operation.description || ''}
   * @tags ${(operation.tags || []).join(', ')}
   */
  async ${operationId}(${methodParams.join(', ')}): Promise<ApiResponse<${responseType}>> {
    const response = await this.axios.${method}<${responseType}>(
      \`${apiPath}\`,
      ${hasBody ? 'data,' : ''}
      {
        ${queryParams.length > 0 ? 'params: query,' : ''}
        ...config
      }
    );
    return response.data;
  }`;
  }

  /**
   * 生成 TypeScript 型別定義
   */
  private static generateTypeScriptTypes(document: any): string {
    const schemas = document.components?.schemas || {};
    const types: string[] = [];

    // 基礎回應型別
    types.push(`
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  timestamp: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}
`);

    // 生成 Schema 型別
    for (const [name, schema] of Object.entries(schemas)) {
      const typeCode = this.generateTypeFromSchema(name, schema as any);
      types.push(typeCode);
    }

    return `/**
 * Auto-generated TypeScript Types
 * Generated from OpenAPI specification
 * @generated
 */

${types.join('\n\n')}
`;
  }

  /**
   * 從 Schema 生成型別
   */
  private static generateTypeFromSchema(name: string, schema: any): string {
    if (schema.enum) {
      return `export enum ${name} {
  ${schema.enum.map((value: string) => `${value.toUpperCase()} = '${value}'`).join(',\n  ')}
}`;
    }

    if (schema.type === 'object') {
      const properties = schema.properties || {};
      const required = schema.required || [];
      
      const fields = Object.entries(properties).map(([propName, propSchema]: [string, any]) => {
        const isRequired = required.includes(propName);
        const propType = this.mapSchemaType(propSchema);
        return `  ${propName}${isRequired ? '' : '?'}: ${propType};`;
      });

      return `export interface ${name} {
${fields.join('\n')}
}`;
    }

    return `export type ${name} = ${this.mapSchemaType(schema)};`;
  }

  /**
   * 生成 Python 客戶端
   */
  private static generatePythonClient(document: any): void {
    const outputPath = path.join(process.cwd(), 'sdk', 'python');
    
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    const pythonCode = `"""
Auto-generated Python API Client
Generated from OpenAPI specification
"""

import requests
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime
import json


class APIClient:
    """API Client for 菜蟲農食 ERP System"""
    
    def __init__(self, base_url: str = "http://localhost:3000", token: Optional[str] = None):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        if token:
            self.set_auth_token(token)
    
    def set_auth_token(self, token: str):
        """Set authentication token"""
        self.session.headers['Authorization'] = f'Bearer {token}'
    
    def _request(self, method: str, path: str, **kwargs) -> Dict[str, Any]:
        """Make HTTP request"""
        url = f"{self.base_url}{path}"
        response = self.session.request(method, url, **kwargs)
        response.raise_for_status()
        return response.json()
    
    # API methods will be generated here
    ${this.generatePythonMethods(document)}
`;

    fs.writeFileSync(
      path.join(outputPath, 'api_client.py'),
      pythonCode
    );

    console.log(`✅ Python client generated at ${outputPath}`);
  }

  /**
   * 生成 Postman Collection
   */
  private static generatePostmanCollection(document: any): void {
    const outputPath = path.join(process.cwd(), 'docs', 'postman');
    
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    const collection = {
      info: {
        name: document.info.title,
        description: document.info.description,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: this.generatePostmanItems(document),
      variable: [
        {
          key: 'baseUrl',
          value: 'http://localhost:3000',
          type: 'string'
        },
        {
          key: 'token',
          value: '',
          type: 'string'
        }
      ],
      auth: {
        type: 'bearer',
        bearer: [
          {
            key: 'token',
            value: '{{token}}',
            type: 'string'
          }
        ]
      }
    };

    fs.writeFileSync(
      path.join(outputPath, 'collection.json'),
      JSON.stringify(collection, null, 2)
    );

    console.log(`✅ Postman collection generated at ${outputPath}`);
  }

  // ==================== Helper Methods ====================

  private static generateOperationId(path: string, method: string): string {
    const parts = path.split('/').filter(p => p && !p.startsWith('{'));
    const resource = parts[parts.length - 1];
    return `${method}${resource.charAt(0).toUpperCase()}${resource.slice(1)}`;
  }

  private static mapSchemaType(schema: any): string {
    if (!schema) return 'any';
    
    if (schema.$ref) {
      const refName = schema.$ref.split('/').pop();
      return refName;
    }
    
    switch (schema.type) {
      case 'string':
        return schema.enum ? schema.enum.map((v: string) => `'${v}'`).join(' | ') : 'string';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'array':
        return `${this.mapSchemaType(schema.items)}[]`;
      case 'object':
        return 'Record<string, any>';
      default:
        return 'any';
    }
  }

  private static getRequestBodyType(requestBody: any): string {
    if (!requestBody) return 'any';
    const content = requestBody.content?.['application/json'];
    if (!content) return 'any';
    return this.mapSchemaType(content.schema);
  }

  private static getResponseType(response: any): string {
    if (!response) return 'any';
    const content = response.content?.['application/json'];
    if (!content) return 'any';
    return this.mapSchemaType(content.schema);
  }

  private static extractTypeNames(document: any): string[] {
    const schemas = document.components?.schemas || {};
    return Object.keys(schemas);
  }

  private static generatePostmanItems(document: any): any[] {
    const items: any[] = [];
    const paths = document.paths || {};
    
    // Group by tags
    const tagGroups: Record<string, any[]> = {};
    
    for (const [path, pathItem] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(pathItem as any)) {
        if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
          const tags = operation.tags || ['default'];
          const tag = tags[0];
          
          if (!tagGroups[tag]) {
            tagGroups[tag] = [];
          }
          
          tagGroups[tag].push({
            name: operation.summary || `${method.toUpperCase()} ${path}`,
            request: {
              method: method.toUpperCase(),
              header: [],
              url: {
                raw: `{{baseUrl}}${path}`,
                host: ['{{baseUrl}}'],
                path: path.split('/').filter(p => p)
              },
              description: operation.description
            }
          });
        }
      }
    }
    
    // Create folders for each tag
    for (const [tag, requests] of Object.entries(tagGroups)) {
      items.push({
        name: tag,
        item: requests
      });
    }
    
    return items;
  }

  private static generatePythonMethods(document: any): string {
    const paths = document.paths || {};
    const methods: string[] = [];
    
    for (const [path, pathItem] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(pathItem as any)) {
        if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
          const operationId = operation.operationId || this.generateOperationId(path, method);
          const pythonMethod = `
    def ${this.toPythonMethodName(operationId)}(self, **kwargs):
        """${operation.summary || operationId}"""
        return self._request('${method.toUpperCase()}', '${path}', **kwargs)`;
          methods.push(pythonMethod);
        }
      }
    }
    
    return methods.join('\n');
  }

  private static toPythonMethodName(name: string): string {
    // Convert camelCase to snake_case
    return name.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }

  /**
   * 生成 API 型別定義檔
   */
  private static generateAPITypes(document: any): void {
    const outputPath = path.join(process.cwd(), 'src', 'types', 'api');
    
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    // 為每個標籤生成獨立的型別檔案
    const tags = this.extractTags(document);
    
    for (const tag of tags) {
      const tagTypes = this.generateTypesForTag(document, tag);
      const fileName = `${tag.toLowerCase().replace(/\s+/g, '-')}.types.ts`;
      
      fs.writeFileSync(
        path.join(outputPath, fileName),
        tagTypes
      );
    }

    // 生成索引檔
    const indexContent = tags.map(tag => 
      `export * from './${tag.toLowerCase().replace(/\s+/g, '-')}.types';`
    ).join('\n');
    
    fs.writeFileSync(
      path.join(outputPath, 'index.ts'),
      indexContent
    );

    console.log(`✅ API types generated at ${outputPath}`);
  }

  private static extractTags(document: any): string[] {
    const tags = new Set<string>();
    const paths = document.paths || {};
    
    for (const pathItem of Object.values(paths)) {
      for (const operation of Object.values(pathItem as any)) {
        if (operation.tags) {
          operation.tags.forEach((tag: string) => tags.add(tag));
        }
      }
    }
    
    return Array.from(tags);
  }

  private static generateTypesForTag(document: any, tag: string): string {
    // Extract operations for this tag
    const operations = this.getOperationsForTag(document, tag);
    const types: string[] = [];
    
    // Generate request/response types for each operation
    for (const operation of operations) {
      if (operation.requestBody) {
        types.push(this.generateRequestType(operation));
      }
      if (operation.responses) {
        types.push(this.generateResponseType(operation));
      }
    }
    
    return `/**
 * API Types for ${tag}
 * Auto-generated from OpenAPI specification
 * @module ${tag}Types
 */

${types.join('\n\n')}
`;
  }

  private static getOperationsForTag(document: any, tag: string): any[] {
    const operations: any[] = [];
    const paths = document.paths || {};
    
    for (const [path, pathItem] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(pathItem as any)) {
        if (operation.tags?.includes(tag)) {
          operations.push({ ...operation, path, method });
        }
      }
    }
    
    return operations;
  }

  private static generateRequestType(operation: any): string {
    const typeName = `${operation.operationId}Request`;
    // Implementation would generate the actual type based on requestBody schema
    return `export interface ${typeName} {
  // Generated from operation ${operation.operationId}
}`;
  }

  private static generateResponseType(operation: any): string {
    const typeName = `${operation.operationId}Response`;
    // Implementation would generate the actual type based on response schema
    return `export interface ${typeName} {
  // Generated from operation ${operation.operationId}
}`;
  }
}