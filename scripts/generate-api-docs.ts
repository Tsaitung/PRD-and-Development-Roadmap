#!/usr/bin/env ts-node

/**
 * API Documentation Generation Script
 * 自動生成 API 文檔腳本
 * 
 * Usage: npm run generate:api-docs
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface APIEndpoint {
  method: string;
  path: string;
  controller: string;
  handler: string;
  description: string;
  tags: string[];
  parameters?: any[];
  requestBody?: any;
  responses?: any;
}

class APIDocGenerator {
  private readonly srcPath = path.join(process.cwd(), 'src');
  private readonly outputPath = path.join(process.cwd(), 'docs', 'api');
  private readonly endpoints: APIEndpoint[] = [];

  async generate(): Promise<void> {
    console.log('🚀 Starting API documentation generation...');
    
    try {
      // Step 1: Scan controllers
      console.log('📂 Scanning controllers...');
      await this.scanControllers();
      
      // Step 2: Extract API metadata
      console.log('🔍 Extracting API metadata...');
      await this.extractMetadata();
      
      // Step 3: Generate Markdown documentation
      console.log('📝 Generating Markdown documentation...');
      await this.generateMarkdown();
      
      // Step 4: Generate API reference
      console.log('📚 Generating API reference...');
      await this.generateAPIReference();
      
      // Step 5: Generate client examples
      console.log('💻 Generating client examples...');
      await this.generateClientExamples();
      
      // Step 6: Generate test collection
      console.log('🧪 Generating test collection...');
      await this.generateTestCollection();
      
      // Step 7: Update README
      console.log('📄 Updating README...');
      await this.updateREADME();
      
      console.log('✅ API documentation generated successfully!');
      console.log(`📁 Output directory: ${this.outputPath}`);
      
    } catch (error) {
      console.error('❌ Error generating documentation:', error);
      process.exit(1);
    }
  }

  /**
   * 掃描所有控制器
   */
  private async scanControllers(): Promise<void> {
    const controllerFiles = await this.findFiles('**/*.controller.ts');
    
    for (const file of controllerFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const endpoints = this.parseController(content, file);
      this.endpoints.push(...endpoints);
    }
    
    console.log(`  Found ${this.endpoints.length} endpoints in ${controllerFiles.length} controllers`);
  }

  /**
   * 解析控制器檔案
   */
  private parseController(content: string, filePath: string): APIEndpoint[] {
    const endpoints: APIEndpoint[] = [];
    const controllerName = path.basename(filePath, '.controller.ts');
    
    // Extract controller metadata
    const controllerMatch = content.match(/@Controller\(['"]([^'"]+)['"]\)/);
    const basePath = controllerMatch ? controllerMatch[1] : '';
    
    const tagMatch = content.match(/@ApiTags\(['"]([^'"]+)['"]\)/);
    const tags = tagMatch ? [tagMatch[1]] : [controllerName];
    
    // Extract methods
    const methodRegex = /@(Get|Post|Put|Delete|Patch)\(['"]?([^'")]*)['""]?\)[^}]*?(\w+)\s*\(/g;
    let match;
    
    while ((match = methodRegex.exec(content)) !== null) {
      const [, method, routePath, handler] = match;
      
      // Extract method documentation
      const methodContent = this.extractMethodContent(content, handler);
      const description = this.extractDescription(methodContent);
      const parameters = this.extractParameters(methodContent);
      const requestBody = this.extractRequestBody(methodContent);
      const responses = this.extractResponses(methodContent);
      
      endpoints.push({
        method: method.toLowerCase(),
        path: this.combinePaths(basePath, routePath),
        controller: controllerName,
        handler,
        description,
        tags,
        parameters,
        requestBody,
        responses
      });
    }
    
    return endpoints;
  }

  /**
   * 生成 Markdown 文檔
   */
  private async generateMarkdown(): Promise<void> {
    const groupedEndpoints = this.groupEndpointsByTag();
    
    for (const [tag, endpoints] of Object.entries(groupedEndpoints)) {
      const markdown = this.generateTagMarkdown(tag, endpoints);
      const fileName = `${tag.toLowerCase().replace(/\s+/g, '-')}.md`;
      
      await this.ensureDir(this.outputPath);
      fs.writeFileSync(
        path.join(this.outputPath, fileName),
        markdown
      );
    }
    
    // Generate index
    await this.generateIndexMarkdown(groupedEndpoints);
  }

  /**
   * 生成標籤 Markdown
   */
  private generateTagMarkdown(tag: string, endpoints: APIEndpoint[]): string {
    const sections: string[] = [];
    
    sections.push(`# ${tag} API Documentation\n`);
    sections.push(`## Overview\n`);
    sections.push(`This section contains all ${tag} related API endpoints.\n`);
    sections.push(`**Total Endpoints**: ${endpoints.length}\n`);
    
    // Table of contents
    sections.push(`## Table of Contents\n`);
    endpoints.forEach((endpoint, index) => {
      sections.push(`${index + 1}. [${endpoint.method.toUpperCase()} ${endpoint.path}](#${this.toAnchor(endpoint)})`);
    });
    
    sections.push(`\n## Endpoints\n`);
    
    // Endpoint details
    for (const endpoint of endpoints) {
      sections.push(this.generateEndpointMarkdown(endpoint));
    }
    
    return sections.join('\n');
  }

  /**
   * 生成端點 Markdown
   */
  private generateEndpointMarkdown(endpoint: APIEndpoint): string {
    const sections: string[] = [];
    
    sections.push(`### ${endpoint.method.toUpperCase()} ${endpoint.path}\n`);
    sections.push(`**Description**: ${endpoint.description || 'No description available'}\n`);
    sections.push(`**Controller**: \`${endpoint.controller}\``);
    sections.push(`**Handler**: \`${endpoint.handler}\`\n`);
    
    // Parameters
    if (endpoint.parameters && endpoint.parameters.length > 0) {
      sections.push(`#### Parameters\n`);
      sections.push(`| Name | Type | In | Required | Description |`);
      sections.push(`|------|------|-----|----------|-------------|`);
      
      for (const param of endpoint.parameters) {
        sections.push(`| ${param.name} | ${param.type} | ${param.in} | ${param.required ? 'Yes' : 'No'} | ${param.description || '-'} |`);
      }
      sections.push('');
    }
    
    // Request body
    if (endpoint.requestBody) {
      sections.push(`#### Request Body\n`);
      sections.push('```json');
      sections.push(JSON.stringify(endpoint.requestBody.example || {}, null, 2));
      sections.push('```\n');
    }
    
    // Responses
    sections.push(`#### Responses\n`);
    sections.push(`| Status | Description |`);
    sections.push(`|--------|-------------|`);
    sections.push(`| 200 | Success |`);
    sections.push(`| 400 | Bad Request |`);
    sections.push(`| 401 | Unauthorized |`);
    sections.push(`| 404 | Not Found |`);
    sections.push(`| 500 | Internal Server Error |\n`);
    
    // Example
    sections.push(`#### Example\n`);
    sections.push(this.generateCurlExample(endpoint));
    
    sections.push(`---\n`);
    
    return sections.join('\n');
  }

  /**
   * 生成 cURL 範例
   */
  private generateCurlExample(endpoint: APIEndpoint): string {
    const lines: string[] = [];
    
    lines.push('```bash');
    lines.push(`curl -X ${endpoint.method.toUpperCase()} \\`);
    lines.push(`  'http://localhost:3000${endpoint.path}' \\`);
    lines.push(`  -H 'Content-Type: application/json' \\`);
    lines.push(`  -H 'Authorization: Bearer YOUR_TOKEN'`);
    
    if (endpoint.requestBody) {
      lines.push(`  -d '${JSON.stringify(endpoint.requestBody.example || {})}'`);
    }
    
    lines.push('```');
    
    return lines.join('\n');
  }

  /**
   * 生成 API 參考文檔
   */
  private async generateAPIReference(): Promise<void> {
    const reference = {
      openapi: '3.0.0',
      info: {
        title: '菜蟲農食 ERP System API',
        version: '1.0.0',
        description: 'Comprehensive ERP system API for agricultural business'
      },
      servers: [
        { url: 'http://localhost:3000', description: 'Development' },
        { url: 'https://api.tsaitung.com', description: 'Production' }
      ],
      paths: this.generateOpenAPIPaths(),
      components: {
        schemas: await this.extractSchemas(),
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    };
    
    // Save as JSON
    fs.writeFileSync(
      path.join(this.outputPath, 'openapi.json'),
      JSON.stringify(reference, null, 2)
    );
    
    // Save as YAML
    const yaml = require('js-yaml');
    fs.writeFileSync(
      path.join(this.outputPath, 'openapi.yaml'),
      yaml.dump(reference)
    );
  }

  /**
   * 生成客戶端範例
   */
  private async generateClientExamples(): Promise<void> {
    const examples = {
      typescript: this.generateTypeScriptExample(),
      python: this.generatePythonExample(),
      javascript: this.generateJavaScriptExample(),
      curl: this.generateCurlExamples()
    };
    
    const examplesPath = path.join(this.outputPath, 'examples');
    await this.ensureDir(examplesPath);
    
    for (const [lang, code] of Object.entries(examples)) {
      const ext = lang === 'python' ? 'py' : lang === 'curl' ? 'sh' : 'ts';
      fs.writeFileSync(
        path.join(examplesPath, `example.${ext}`),
        code
      );
    }
  }

  /**
   * 生成 TypeScript 範例
   */
  private generateTypeScriptExample(): string {
    return `/**
 * TypeScript API Client Example
 */

import { APIClient } from '../sdk/typescript/api-client';

async function example() {
  // Initialize client
  const client = new APIClient('http://localhost:3000');
  
  // Authentication
  const authResponse = await client.login({
    username: 'admin@tsaitung.com',
    password: 'password'
  });
  
  // Set token
  client.setAuthToken(authResponse.data.accessToken);
  
  // Get orders
  const orders = await client.getOrders({
    page: 1,
    pageSize: 20,
    status: ['pending', 'confirmed']
  });
  
  console.log('Orders:', orders.data);
  
  // Create order
  const newOrder = await client.createOrder({
    customerId: 'customer-001',
    items: [
      {
        productId: 'prod-001',
        quantity: 10,
        unitPrice: 100
      }
    ],
    deliveryDate: new Date('2025-09-01'),
    notes: 'Urgent delivery required'
  });
  
  console.log('New order created:', newOrder.data);
}

example().catch(console.error);
`;
  }

  /**
   * 生成 Python 範例
   */
  private generatePythonExample(): string {
    return `"""
Python API Client Example
"""

from api_client import APIClient
from datetime import datetime

def main():
    # Initialize client
    client = APIClient("http://localhost:3000")
    
    # Authentication
    auth_response = client.login(
        json={
            "username": "admin@tsaitung.com",
            "password": "password"
        }
    )
    
    # Set token
    client.set_auth_token(auth_response["data"]["accessToken"])
    
    # Get orders
    orders = client.get_orders(
        params={
            "page": 1,
            "pageSize": 20,
            "status": ["pending", "confirmed"]
        }
    )
    
    print(f"Orders: {orders['data']}")
    
    # Create order
    new_order = client.create_order(
        json={
            "customerId": "customer-001",
            "items": [
                {
                    "productId": "prod-001",
                    "quantity": 10,
                    "unitPrice": 100
                }
            ],
            "deliveryDate": "2025-09-01",
            "notes": "Urgent delivery required"
        }
    )
    
    print(f"New order created: {new_order['data']}")

if __name__ == "__main__":
    main()
`;
  }

  /**
   * 生成 JavaScript 範例
   */
  private generateJavaScriptExample(): string {
    return `/**
 * JavaScript API Client Example
 */

const axios = require('axios');

class APIClient {
  constructor(baseURL = 'http://localhost:3000') {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    this.token = null;
  }
  
  setAuthToken(token) {
    this.token = token;
    this.client.defaults.headers.common['Authorization'] = \`Bearer \${token}\`;
  }
  
  async login(credentials) {
    const response = await this.client.post('/auth/login', credentials);
    return response.data;
  }
  
  async getOrders(params) {
    const response = await this.client.get('/orders', { params });
    return response.data;
  }
  
  async createOrder(data) {
    const response = await this.client.post('/orders', data);
    return response.data;
  }
}

// Usage
async function example() {
  const client = new APIClient();
  
  try {
    // Login
    const auth = await client.login({
      username: 'admin@tsaitung.com',
      password: 'password'
    });
    
    client.setAuthToken(auth.data.accessToken);
    
    // Get orders
    const orders = await client.getOrders({
      page: 1,
      pageSize: 20
    });
    
    console.log('Orders:', orders.data);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

example();
`;
  }

  /**
   * 生成 cURL 範例集
   */
  private generateCurlExamples(): string {
    const examples: string[] = [];
    
    examples.push('#!/bin/bash');
    examples.push('# cURL API Examples\n');
    
    examples.push('# Set base URL');
    examples.push('BASE_URL="http://localhost:3000"\n');
    
    examples.push('# Login and get token');
    examples.push('TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \\');
    examples.push('  -H "Content-Type: application/json" \\');
    examples.push('  -d \'{"username":"admin@tsaitung.com","password":"password"}\' \\');
    examples.push('  | jq -r \'.data.accessToken\')\n');
    
    examples.push('echo "Token: $TOKEN"\n');
    
    // Add examples for each endpoint group
    const groups = this.groupEndpointsByTag();
    
    for (const [tag, endpoints] of Object.entries(groups)) {
      examples.push(`# ${tag} Examples`);
      
      for (const endpoint of endpoints.slice(0, 2)) { // First 2 examples per tag
        examples.push(`# ${endpoint.description || endpoint.handler}`);
        examples.push(`curl -X ${endpoint.method.toUpperCase()} "$BASE_URL${endpoint.path}" \\`);
        examples.push('  -H "Authorization: Bearer $TOKEN" \\');
        examples.push('  -H "Content-Type: application/json"');
        
        if (endpoint.requestBody) {
          examples.push(`  -d '${JSON.stringify(endpoint.requestBody.example || {})}'`);
        }
        
        examples.push('');
      }
    }
    
    return examples.join('\n');
  }

  /**
   * 生成測試集合
   */
  private async generateTestCollection(): Promise<void> {
    const collection = {
      name: 'ERP API Tests',
      requests: this.endpoints.map(endpoint => ({
        name: `${endpoint.method.toUpperCase()} ${endpoint.path}`,
        method: endpoint.method.toUpperCase(),
        url: `{{baseUrl}}${endpoint.path}`,
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Authorization', value: 'Bearer {{token}}' }
        ],
        body: endpoint.requestBody ? {
          mode: 'raw',
          raw: JSON.stringify(endpoint.requestBody.example || {}, null, 2)
        } : undefined,
        tests: this.generatePostmanTests(endpoint)
      })),
      variables: [
        { key: 'baseUrl', value: 'http://localhost:3000' },
        { key: 'token', value: '' }
      ]
    };
    
    fs.writeFileSync(
      path.join(this.outputPath, 'postman-tests.json'),
      JSON.stringify(collection, null, 2)
    );
  }

  /**
   * 生成 Postman 測試腳本
   */
  private generatePostmanTests(endpoint: APIEndpoint): string {
    return `
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response time is less than 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

pm.test("Response has required fields", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
    pm.expect(jsonData).to.have.property('data');
});
`;
  }

  // ==================== Helper Methods ====================

  private async findFiles(pattern: string): Promise<string[]> {
    const glob = require('glob');
    return new Promise((resolve, reject) => {
      glob(path.join(this.srcPath, pattern), (err: Error, files: string[]) => {
        if (err) reject(err);
        else resolve(files);
      });
    });
  }

  private extractMethodContent(content: string, methodName: string): string {
    const regex = new RegExp(`${methodName}\\s*\\([^}]*\\}`, 's');
    const match = content.match(regex);
    return match ? match[0] : '';
  }

  private extractDescription(content: string): string {
    const match = content.match(/@ApiOperation\(\{[^}]*summary:\s*['"]([^'"]+)['"]/);
    return match ? match[1] : '';
  }

  private extractParameters(content: string): any[] {
    // Implementation would extract @Param decorators
    return [];
  }

  private extractRequestBody(content: string): any {
    // Implementation would extract @Body decorator
    return null;
  }

  private extractResponses(content: string): any {
    // Implementation would extract @ApiResponse decorators
    return {};
  }

  private combinePaths(...paths: string[]): string {
    return '/' + paths.filter(p => p).join('/').replace(/\/+/g, '/');
  }

  private groupEndpointsByTag(): Record<string, APIEndpoint[]> {
    const groups: Record<string, APIEndpoint[]> = {};
    
    for (const endpoint of this.endpoints) {
      for (const tag of endpoint.tags) {
        if (!groups[tag]) {
          groups[tag] = [];
        }
        groups[tag].push(endpoint);
      }
    }
    
    return groups;
  }

  private toAnchor(endpoint: APIEndpoint): string {
    return `${endpoint.method}-${endpoint.path}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  private async ensureDir(dirPath: string): Promise<void> {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  private generateOpenAPIPaths(): any {
    const paths: any = {};
    
    for (const endpoint of this.endpoints) {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {};
      }
      
      paths[endpoint.path][endpoint.method] = {
        tags: endpoint.tags,
        summary: endpoint.description,
        operationId: `${endpoint.controller}_${endpoint.handler}`,
        parameters: endpoint.parameters,
        requestBody: endpoint.requestBody,
        responses: {
          '200': { description: 'Success' },
          '400': { description: 'Bad Request' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Not Found' },
          '500': { description: 'Internal Server Error' }
        }
      };
    }
    
    return paths;
  }

  private async extractSchemas(): Promise<any> {
    // Implementation would extract DTOs and entities
    return {};
  }

  private async generateIndexMarkdown(groups: Record<string, APIEndpoint[]>): Promise<void> {
    const sections: string[] = [];
    
    sections.push('# 菜蟲農食 ERP System API Documentation\n');
    sections.push('## Overview\n');
    sections.push('Complete API documentation for the Tsaitung ERP system.\n');
    
    // Statistics
    const totalEndpoints = this.endpoints.length;
    const totalGroups = Object.keys(groups).length;
    
    sections.push('## Statistics\n');
    sections.push(`- **Total Endpoints**: ${totalEndpoints}`);
    sections.push(`- **API Groups**: ${totalGroups}`);
    sections.push(`- **Base URL**: http://localhost:3000`);
    sections.push(`- **Version**: 1.0.0\n`);
    
    // API Groups
    sections.push('## API Groups\n');
    sections.push('| Group | Endpoints | Documentation |');
    sections.push('|-------|-----------|---------------|');
    
    for (const [tag, endpoints] of Object.entries(groups)) {
      const fileName = `${tag.toLowerCase().replace(/\s+/g, '-')}.md`;
      sections.push(`| ${tag} | ${endpoints.length} | [View](${fileName}) |`);
    }
    
    // Authentication
    sections.push('\n## Authentication\n');
    sections.push('All API endpoints require JWT authentication. Include the token in the Authorization header:');
    sections.push('```');
    sections.push('Authorization: Bearer YOUR_JWT_TOKEN');
    sections.push('```\n');
    
    // Quick Start
    sections.push('## Quick Start\n');
    sections.push('1. **Login** to get access token');
    sections.push('```bash');
    sections.push('curl -X POST http://localhost:3000/auth/login \\');
    sections.push('  -H "Content-Type: application/json" \\');
    sections.push('  -d \'{"username":"admin@tsaitung.com","password":"password"}\'');
    sections.push('```\n');
    
    sections.push('2. **Use the token** in subsequent requests');
    sections.push('```bash');
    sections.push('curl -X GET http://localhost:3000/api/orders \\');
    sections.push('  -H "Authorization: Bearer YOUR_TOKEN"');
    sections.push('```\n');
    
    // Links
    sections.push('## Resources\n');
    sections.push('- [OpenAPI Specification](openapi.json)');
    sections.push('- [Postman Collection](postman-tests.json)');
    sections.push('- [TypeScript SDK](/sdk/typescript)');
    sections.push('- [Python SDK](/sdk/python)');
    sections.push('- [Examples](examples/)\n');
    
    fs.writeFileSync(
      path.join(this.outputPath, 'README.md'),
      sections.join('\n')
    );
  }

  private async updateREADME(): Promise<void> {
    const readmePath = path.join(process.cwd(), 'README.md');
    
    if (!fs.existsSync(readmePath)) {
      return;
    }
    
    let content = fs.readFileSync(readmePath, 'utf-8');
    
    // Update API documentation section
    const apiSection = `
## API Documentation

The API documentation is automatically generated and available at:

- **Swagger UI**: http://localhost:3000/api-docs
- **OpenAPI Spec**: [docs/api/openapi.json](docs/api/openapi.json)
- **Markdown Docs**: [docs/api/](docs/api/)
- **Postman Collection**: [docs/api/postman-tests.json](docs/api/postman-tests.json)

### Quick Links

- [Authentication API](docs/api/authentication.md)
- [Orders API](docs/api/orders.md)
- [Inventory API](docs/api/inventory.md)
- [CRM API](docs/api/crm.md)

### Generating Documentation

To regenerate the API documentation:

\`\`\`bash
npm run generate:api-docs
\`\`\`
`;
    
    // Replace or append API section
    if (content.includes('## API Documentation')) {
      content = content.replace(/## API Documentation[\s\S]*?(?=##|$)/, apiSection + '\n');
    } else {
      content += '\n' + apiSection;
    }
    
    fs.writeFileSync(readmePath, content);
  }

  private async extractMetadata(): Promise<void> {
    // Additional metadata extraction if needed
  }
}

// Run the generator
if (require.main === module) {
  const generator = new APIDocGenerator();
  generator.generate().catch(console.error);
}

export { APIDocGenerator };