const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { parse } = require('csv-parse');
const crypto = require('crypto');

const CONFIG = {
    CROWDIN_API_ENDPOINT: process.env.CROWDIN_API_ENDPOINT || 'https://api.crowdin.com/api/v2',
    CROWDIN_PROJECT_ID: process.env.CROWDIN_PROJECT_ID || '604593',
    BLACKLISTED_CONTRIBUTORS_FILE: process.env.BLACKLISTED_CONTRIBUTORS_FILE || './.github/scripts/blacklisted-contributors.json',
    LEADERBOARD_FILE: process.env.LEADERBOARD_FILE || './src/components/TranslationLeaderboard/leaderboard',
    RETRY_DELAY: parseInt(process.env.RETRY_DELAY) || 2000,
    MAX_RETRIES: parseInt(process.env.MAX_RETRIES) || 5,
    HTTP_TIMEOUT: parseInt(process.env.HTTP_TIMEOUT) || 10000,
};

const CROWDIN_PERSONAL_TOKEN = process.env.CROWDIN_PERSONAL_TOKEN;
if (!CROWDIN_PERSONAL_TOKEN) {
    console.error('CROWDIN_PERSONAL_TOKEN is not set');
    process.exit(1);
} 

// Calculate current month boundaries in UTC (from start of month to now)
function getCurrentMonthDates() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    
    const firstDay = new Date(Date.UTC(year, month, 1));
    
    const startDate = firstDay.toISOString().replace(/\.\d{3}Z$/, '+00:00');
    const endDate = now.toISOString().replace(/\.\d{3}Z$/, '+00:00');
    
    return { startDate, endDate };
}

// Calculate previous month boundaries in UTC
function getPreviousMonthDates() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    
    // Handle year transition
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    
    const firstDay = new Date(Date.UTC(prevYear, prevMonth, 1));
    const lastDay = new Date(Date.UTC(prevYear, prevMonth + 1, 0));
    
    const startDate = firstDay.toISOString().replace(/\.\d{3}Z$/, '+00:00');
    const endDate = lastDay.toISOString().replace(/T[\d:]+\.\d{3}Z$/, 'T23:59:59+00:00');
    
    return { startDate, endDate };
}

// Format month name for display
function getMonthDisplayName(year, month) {
    const date = new Date(Date.UTC(year, month, 1));
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(method, url, config = {}) {
    let retries = 0;
    while (retries < CONFIG.MAX_RETRIES) {
        try {
            return await axios({ method, url, timeout: CONFIG.HTTP_TIMEOUT, ...config });
        } catch (error) {
            if (error.response && error.response.status === 429) {
                const delayAmount = CONFIG.RETRY_DELAY * Math.pow(2, retries) * (1 + Math.random());
                await delay(delayAmount);
                retries++;
            } else {
                console.error('Detailed Error:', error);
                throw error;
            }
        }
    }
    throw new Error('Maximum retry limit reached');
}

function normalizeString(str) {
    return str.normalize('NFC').trim();
}

function extractUsername(name) {
    const match = name.match(/\(([^)]+)\)/);
    return match && match[1] ? normalizeString(match[1]) : normalizeString(name);
}

function generateKey(name) {
    const normalized = normalizeString(name);
    return crypto.createHash('sha256').update(normalized).digest('hex');
}


async function getProjectMembers() {
    try {
        const response = await makeRequest('get', `${CONFIG.CROWDIN_API_ENDPOINT}/projects/${CONFIG.CROWDIN_PROJECT_ID}/members`, {
            headers: { 'Authorization': `Bearer ${CROWDIN_PERSONAL_TOKEN}` }
        });
        return response.data.data.reduce((mapping, member) => {
            const originalName = member.data.username;
            const key = generateKey(originalName);
            mapping[key] = {
                originalName: originalName,
                id: member.data.id,
                avatarUrl: member.data.avatarUrl,
                hashKey: key
            };
            return mapping;
        }, {});
    } catch (error) {
        console.error('Error in getProjectMembers:', error);
        throw error;
    }
}



async function generateMonthlyReport(startDate, endDate) {
    try {
        const response = await makeRequest('post', `${CONFIG.CROWDIN_API_ENDPOINT}/projects/${CONFIG.CROWDIN_PROJECT_ID}/reports`, {
            data: {
                name: "top-members",
                schema: { unit: "words", format: "csv", dateFrom: startDate, dateTo: endDate }
            },
            headers: { 'Authorization': `Bearer ${CROWDIN_PERSONAL_TOKEN}`, 'Content-Type': 'application/json' }
        });
        return response.data.data.identifier;
    } catch (error) {
        console.error('Error in generateMonthlyReport:', error);
        throw error;
    }
}

async function generateAllTimeReport() {
    try {
        const response = await makeRequest('post', `${CONFIG.CROWDIN_API_ENDPOINT}/projects/${CONFIG.CROWDIN_PROJECT_ID}/reports`, {
            data: {
                name: "top-members",
                schema: { unit: "words", format: "csv" }
            },
            headers: { 'Authorization': `Bearer ${CROWDIN_PERSONAL_TOKEN}`, 'Content-Type': 'application/json' }
        });
        return response.data.data.identifier;
    } catch (error) {
        console.error('Error in generateAllTimeReport:', error);
        throw error;
    }
}

async function downloadReport(identifier) {
    try {
        let reportStatus = '';
        do {
            const response = await makeRequest('get', `${CONFIG.CROWDIN_API_ENDPOINT}/projects/${CONFIG.CROWDIN_PROJECT_ID}/reports/${identifier}`, {
                headers: { 'Authorization': `Bearer ${CROWDIN_PERSONAL_TOKEN}` }
            });
            reportStatus = response.data.data.status;
            if (reportStatus === 'finished') {
                const downloadResponse = await makeRequest('get', `${CONFIG.CROWDIN_API_ENDPOINT}/projects/${CONFIG.CROWDIN_PROJECT_ID}/reports/${identifier}/download`, {
                    headers: { 'Authorization': `Bearer ${CROWDIN_PERSONAL_TOKEN}` }
                });
                return downloadResponse.data.data.url;
            } else {
                await delay(CONFIG.RETRY_DELAY);
            }
        } while (reportStatus !== 'finished');
    } catch (error) {
        console.error('Error in downloadReport:', error);
        throw error;
    }
}

async function loadBlacklistedContributors() {
    try {
        const data = await fs.readFile(CONFIG.BLACKLISTED_CONTRIBUTORS_FILE, 'utf8');
        const blacklistedSet = new Set(JSON.parse(data));
        return blacklistedSet;
    } catch (error) {
        console.error('Error in loadBlacklistedContributors:', error);
        throw error;
    }
}

async function processCsvData(csvData, membersMapping, blacklistedContributors) {
    return new Promise((resolve, reject) => {
        try {
            const records = [];
            const parser = parse({ columns: true, skip_empty_lines: true });
            parser.on('readable', function () {
                let record;
                while ((record = parser.read()) !== null) {
                    records.push(record);
                }
            });
            parser.on('end', function () {
                const filteredRecords = records.filter(record => {
                    const usernameFromCsv = extractUsername(record.Name);
                    const key = generateKey(usernameFromCsv);
                    if (membersMapping[key]) {
                        Object.assign(record, membersMapping[key]);
                    }
                    // Use the extracted username if originalName is not available
                    const nameToCheck = record.originalName || usernameFromCsv;
                    const isBlacklisted = blacklistedContributors.has(nameToCheck);
                    if(isBlacklisted) console.log('Filtered out blacklisted contributor:', nameToCheck);
                    return !isBlacklisted;
                });
                resolve(filteredRecords);
            });
            parser.write(csvData);
            parser.end();
        } catch (error) {
            console.error('Error in processCsvData:', error);
            reject(error);
        }
    });
}

async function saveDataToJson(data, filePath, metadata = {}) {
    try {
        const output = {
            metadata: {
                generatedAt: new Date().toISOString(),
                ...metadata
            },
            data: data
        };
        await fs.writeFile(filePath, JSON.stringify(output, null, 2), 'utf8');
    } catch (error) {
        console.error('Error in saveDataToJson:', error);
        throw error;
    }
}


(async function main() {
    try {
        // Load blacklisted contributors and project members
        const blacklistedContributors = await loadBlacklistedContributors();
        const membersMapping = await getProjectMembers();

        // Get date ranges
        const currentMonthDates = getCurrentMonthDates();
        const previousMonthDates = getPreviousMonthDates();
        
        // Get current date info for display names
        const now = new Date();
        const currentYear = now.getUTCFullYear();
        const currentMonth = now.getUTCMonth();
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        // Generating and processing the all-time report
        const allTimeReportIdentifier = await generateAllTimeReport();
        const allTimeDownloadUrl = await downloadReport(allTimeReportIdentifier);
        const allTimeCsvDataResponse = await makeRequest('get', allTimeDownloadUrl);
        const allTimeLeaderboardData = await processCsvData(allTimeCsvDataResponse.data, membersMapping, blacklistedContributors);
        await saveDataToJson(allTimeLeaderboardData, `${CONFIG.LEADERBOARD_FILE}.json`, {
            period: 'All Time',
            description: 'All time contributions',
            startDate: '2023-07-28T00:00:00+00:00', // Project start date
            endDate: now.toISOString().replace(/\.\d{3}Z$/, '+00:00')
        });

        // Generating and processing the current month report
        const currentMonthReportIdentifier = await generateMonthlyReport(currentMonthDates.startDate, currentMonthDates.endDate);
        const currentMonthDownloadUrl = await downloadReport(currentMonthReportIdentifier);
        const currentMonthCsvDataResponse = await makeRequest('get', currentMonthDownloadUrl);
        const currentMonthLeaderboardData = await processCsvData(currentMonthCsvDataResponse.data, membersMapping, blacklistedContributors);
        await saveDataToJson(currentMonthLeaderboardData, `${CONFIG.LEADERBOARD_FILE}-current-month.json`, {
            period: getMonthDisplayName(currentYear, currentMonth),
            startDate: currentMonthDates.startDate,
            endDate: currentMonthDates.endDate,
            description: 'Current month contributions'
        });

        // Generating and processing the previous month report
        const previousMonthReportIdentifier = await generateMonthlyReport(previousMonthDates.startDate, previousMonthDates.endDate);
        const previousMonthDownloadUrl = await downloadReport(previousMonthReportIdentifier);
        const previousMonthCsvDataResponse = await makeRequest('get', previousMonthDownloadUrl);
        const previousMonthLeaderboardData = await processCsvData(previousMonthCsvDataResponse.data, membersMapping, blacklistedContributors);
        await saveDataToJson(previousMonthLeaderboardData, `${CONFIG.LEADERBOARD_FILE}-previous-month.json`, {
            period: getMonthDisplayName(prevYear, prevMonth),
            startDate: previousMonthDates.startDate,
            endDate: previousMonthDates.endDate,
            description: 'Previous month contributions'
        });

    } catch (error) {
        console.error('Error in main function:', error);
    }
})();

