#!/usr/bin/env node

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const uri = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio';
const backupDir = path.join(__dirname, '../backup/mongodb-export');

async function exportSingleCollection(collectionName) {
  console.log(`\n导出 ${collectionName}...`);
  
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 60000,
    socketTimeoutMS: 180000,
    connectTimeoutMS: 180000,
    maxPoolSize: 1,
    retryReads: true,
    heartbeatFrequencyMS: 30000,
  });
  
  const maxRetries = 5;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await client.connect();
      console.log(`  连接成功 (尝试 ${attempt}/${maxRetries})`);
      
      const db = client.db('machrio');
      const collection = db.collection(collectionName);
      
      console.log(`  读取数据中...`);
      const docs = await collection.find({}).toArray();
      
      const filePath = path.join(backupDir, `${collectionName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2));
      
      console.log(`✓ ${collectionName}: ${docs.length} 条记录`);
      console.log(`  文件大小：${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB`);
      
      await client.close();
      return docs.length;
      
    } catch (err) {
      console.log(`  ⚠️ 第 ${attempt} 次失败：${err.message}`);
      
      try {
        await client.close();
      } catch (e) {}
      
      if (attempt === maxRetries) {
        throw err;
      }
      
      const waitTime = 3000 * attempt;
      console.log(`  等待 ${waitTime/1000} 秒后重试...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  return 0;
}

async function main() {
  console.log('🚀 开始导出 MongoDB 数据 (单集合独立连接模式)');
  console.log('=' .repeat(50));
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const collections = [
    'articles',
    'payload-preferences', 
    'productviews',
    'categories',
    'products'
  ];
  
  const results = [];
  
  for (const colName of collections) {
    try {
      const count = await exportSingleCollection(colName);
      results.push({ name: colName, count, success: true });
    } catch (err) {
      console.error(`❌ ${colName} 最终失败：${err.message}`);
      results.push({ name: colName, count: 0, success: false });
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('导出汇总:');
  console.log('-'.repeat(50));
  
  let totalSuccess = 0;
  let totalCount = 0;
  
  for (const result of results) {
    const status = result.success ? '✓' : '❌';
    console.log(`${status} ${result.name}: ${result.count} 条记录`);
    if (result.success) {
      totalSuccess++;
      totalCount += result.count;
    }
  }
  
  console.log('-'.repeat(50));
  console.log(`总计：${totalSuccess}/${collections.length} 个集合成功`);
  console.log(`总记录数：${totalCount} 条`);
  console.log(`保存位置：${backupDir}`);
  
  if (totalSuccess < collections.length) {
    console.log('\n⚠️ 警告：部分集合导出失败');
    process.exit(1);
  } else {
    console.log('\n✅ 所有数据导出成功！');
  }
}

main();
