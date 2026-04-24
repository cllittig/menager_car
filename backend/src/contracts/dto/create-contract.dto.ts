import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateContractDto {
  @ApiProperty({ 
    description: 'ID da transação relacionada ao contrato', 
    example: 'uuid-transaction-example' 
  })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiProperty({ 
    description: 'Nome do arquivo do contrato', 
    example: 'contrato_venda_joao_silva.pdf' 
  })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ 
    description: 'Tipo MIME do arquivo', 
    example: 'application/pdf' 
  })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({ 
    description: 'Tamanho do arquivo em bytes', 
    example: 2048576 
  })
  @IsNumber()
  @Type(() => Number)
  fileSize: number;

  @ApiProperty({ 
    description: 'Hash MD5 do arquivo para integridade', 
    example: 'a1b2c3d4e5f6...' 
  })
  @IsString()
  @IsNotEmpty()
  fileHash: string;

  @ApiProperty({ 
    description: 'Buffer do arquivo em base64', 
    example: 'JVBERi0xLjQKJeLjz9MKMSAwIG9iagoKZW5kb2JqCjIgMCBvYmoKPDwvVHlwZS9QYWdlcy9LaWRzWzMgMCBSXS9Db3VudCAxPj4KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZS9QYWdlL01lZGlhQm94WzAgMCA2MTIgNzkyXS9SZXNvdXJjZXMgNSAwIFIvUGFyZW50IDIgMCBSL0NvbnRlbnRzIDQgMCBSPj4KZW5kb2JqCjQgMCBvYmoKPDwvTGVuZ3RoIDQ0Pj4Kc3RyZWFtCkJUCjUwIDc1MCBUZApBbGV4YW5kcmUgSW5pdGNpYWwgU3lzdGVtICgzLjAgKSBUagpFVApkZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8L0ZvbnQgNiAwIFI+PgplbmRvYmoKNiAwIG9iago8PC9GMSc7...' 
  })
  @IsString()
  @IsNotEmpty()
  fileBuffer: string; // Base64 encoded
}

export class UploadContractDto {
  @ApiProperty({ 
    description: 'ID da transação relacionada ao contrato', 
    example: 'uuid-transaction-example' 
  })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiProperty({ 
    description: 'Tipo da transação', 
    example: 'SALE',
    enum: ['PURCHASE', 'SALE', 'MAINTENANCE']
  })
  @IsString()
  @IsNotEmpty()
  transactionType: string;

  @ApiProperty({ 
    description: 'Valor da transação', 
    example: '50000'
  })
  @IsString()
  @IsNotEmpty()
  transactionAmount: string;
} 