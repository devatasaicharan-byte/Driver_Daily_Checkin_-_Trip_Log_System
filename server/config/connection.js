const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_TYPE = process.env.DB_TYPE || 'json';
const dbFilePath = path.join(__dirname, '../database/local_db.json');

// Ensure local JSON database directory and file exist
function initializeJsonDb() {
  const dir = path.dirname(dbFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(dbFilePath)) {
    const initialSchema = {
      users: [],
      drivers: [],
      vehicles: [],
      trips: [],
      checkins: []
    };
    fs.writeFileSync(dbFilePath, JSON.stringify(initialSchema, null, 2), 'utf-8');
  }
}

let mysqlPool = null;

if (DB_TYPE === 'mysql') {
  try {
    mysqlPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'manivtha_transport',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    console.log('MySQL Connection Pool initialized.');
  } catch (error) {
    console.error('Failed to initialize MySQL pool. Falling back to JSON DB.', error.message);
  }
}

// Read JSON database file
function readJsonDb() {
  initializeJsonDb();
  try {
    const data = fs.readFileSync(dbFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading JSON DB, resetting.', err);
    return { users: [], drivers: [], vehicles: [], trips: [], checkins: [] };
  }
}

// Write JSON database file
function writeJsonDb(data) {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to JSON DB', err);
  }
}

// A simple SQL query parser for local JSON fallback
function executeJsonQuery(sql, params = []) {
  const db = readJsonDb();
  
  // Clean up SQL
  const cleanSql = sql.replace(/\s+/g, ' ').trim();
  
  // 1. SELECT queries
  if (cleanSql.toUpperCase().startsWith('SELECT')) {
    const selectMatch = cleanSql.match(/FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/i);
    if (!selectMatch) {
      throw new Error(`Unsupported SELECT syntax: ${sql}`);
    }
    
    const tableName = selectMatch[1].toLowerCase();
    const whereClause = selectMatch[2];
    const orderByClause = selectMatch[3];
    const limitVal = selectMatch[4] ? parseInt(selectMatch[4]) : null;
    
    let rows = db[tableName] || [];
    
    // Apply WHERE clause
    if (whereClause) {
      // Split on AND (case insensitive)
      const conditions = whereClause.split(/\s+AND\s+/i);
      
      rows = rows.filter(row => {
        let paramIndex = 0;
        return conditions.every(cond => {
          // Matches field = ? or field LIKE ? or field IS NULL
          const eqMatch = cond.match(/(\w+)\s*=\s*\?/);
          const likeMatch = cond.match(/(\w+)\s+LIKE\s*\?/i);
          const isNullMatch = cond.match(/(\w+)\s+IS\s+NULL/i);
          
          if (eqMatch) {
            const field = eqMatch[1];
            const val = params[paramIndex++];
            return row[field] == val; // Loose equality for safety
          } else if (likeMatch) {
            const field = likeMatch[1];
            let val = params[paramIndex++];
            if (typeof val === 'string') {
              // Convert SQL LIKE syntax %val% to JS regex
              val = val.replace(/%/g, '.*');
              const regex = new RegExp('^' + val + '$', 'i');
              return regex.test(row[field]);
            }
            return false;
          } else if (isNullMatch) {
            const field = isNullMatch[1];
            return row[field] === null || row[field] === undefined;
          }
          return true;
        });
      });
    }
    
    // Apply ORDER BY
    if (orderByClause) {
      const parts = orderByClause.trim().split(/\s+/);
      const field = parts[0];
      const direction = parts[1] ? parts[1].toUpperCase() : 'ASC';
      
      rows.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];
        
        // Handle dates and numbers
        if (typeof valA === 'string' && !isNaN(Date.parse(valA))) {
          valA = new Date(valA);
          valB = new Date(valB);
        }
        
        if (valA < valB) return direction === 'DESC' ? 1 : -1;
        if (valA > valB) return direction === 'DESC' ? -1 : 1;
        return 0;
      });
    }
    
    // Apply LIMIT
    if (limitVal !== null) {
      rows = rows.slice(0, limitVal);
    }
    
    return [JSON.parse(JSON.stringify(rows))]; // Return cloned array like mysql
  }
  
  // 2. INSERT queries
  if (cleanSql.toUpperCase().startsWith('INSERT INTO')) {
    const insertMatch = cleanSql.match(/INSERT\s+INTO\s+(\w+)\s*\((.+?)\)\s*VALUES\s*\((.+?)\)/i);
    if (!insertMatch) {
      throw new Error(`Unsupported INSERT syntax: ${sql}`);
    }
    
    const tableName = insertMatch[1].toLowerCase();
    const columns = insertMatch[2].split(',').map(c => c.trim());
    
    const newRecord = { id: db[tableName].length > 0 ? Math.max(...db[tableName].map(r => r.id || 0)) + 1 : 1 };
    
    columns.forEach((col, idx) => {
      newRecord[col] = params[idx];
    });
    
    // Auto populate dates if missing and applicable
    if (columns.includes('createdAt') && !newRecord.createdAt) {
      newRecord.createdAt = new Date().toISOString();
    }
    
    db[tableName].push(newRecord);
    writeJsonDb(db);
    
    return [{ insertId: newRecord.id, affectedRows: 1 }];
  }
  
  // 3. UPDATE queries
  if (cleanSql.toUpperCase().startsWith('UPDATE')) {
    const updateMatch = cleanSql.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+?))?$/i);
    if (!updateMatch) {
      throw new Error(`Unsupported UPDATE syntax: ${sql}`);
    }
    
    const tableName = updateMatch[1].toLowerCase();
    const setClause = updateMatch[2];
    const whereClause = updateMatch[3];
    
    // Parse sets
    const sets = setClause.split(',').map(s => s.trim());
    let paramIndex = 0;
    
    const setUpdates = {};
    sets.forEach(set => {
      const match = set.match(/(\w+)\s*=\s*\?/);
      if (match) {
        setUpdates[match[1]] = params[paramIndex++];
      }
    });
    
    // Filter rows to update based on WHERE clause (usually ID = ?)
    let affectedRows = 0;
    if (whereClause) {
      const whereMatch = whereClause.match(/(\w+)\s*=\s*\?/);
      if (whereMatch) {
        const field = whereMatch[1];
        const whereVal = params[paramIndex++];
        
        db[tableName] = db[tableName].map(row => {
          if (row[field] == whereVal) {
            affectedRows++;
            return { ...row, ...setUpdates };
          }
          return row;
        });
      }
    }
    
    if (affectedRows > 0) {
      writeJsonDb(db);
    }
    
    return [{ affectedRows }];
  }
  
  // 4. DELETE queries
  if (cleanSql.toUpperCase().startsWith('DELETE FROM')) {
    const deleteMatch = cleanSql.match(/DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?$/i);
    if (!deleteMatch) {
      throw new Error(`Unsupported DELETE syntax: ${sql}`);
    }
    
    const tableName = deleteMatch[1].toLowerCase();
    const whereClause = deleteMatch[2];
    
    let affectedRows = 0;
    if (whereClause) {
      const whereMatch = whereClause.match(/(\w+)\s*=\s*\?/);
      if (whereMatch) {
        const field = whereMatch[1];
        const val = params[0];
        
        const initialLength = db[tableName].length;
        db[tableName] = db[tableName].filter(row => row[field] != val);
        affectedRows = initialLength - db[tableName].length;
      }
    } else {
      affectedRows = db[tableName].length;
      db[tableName] = [];
    }
    
    if (affectedRows > 0) {
      writeJsonDb(db);
    }
    
    return [{ affectedRows }];
  }
  
  throw new Error(`Unrecognized or unsupported SQL: ${sql}`);
}

async function query(sql, params = []) {
  if (DB_TYPE === 'mysql' && mysqlPool) {
    try {
      const [results] = await mysqlPool.query(sql, params);
      return results;
    } catch (error) {
      console.error('MySQL query error, using local JSON fallback:', error.message);
      return executeJsonQuery(sql, params)[0];
    }
  } else {
    // Sync-like delay to simulate real db call
    await new Promise(resolve => setTimeout(resolve, 50));
    const results = executeJsonQuery(sql, params);
    return results[0];
  }
}

module.exports = {
  query,
  DB_TYPE
};
