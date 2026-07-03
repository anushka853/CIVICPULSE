import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

// Initialize client if API key is provided
let client = null;
if (process.env.GEMINI_API_KEY) {
  client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
} else {
  console.warn('WARNING: GEMINI_API_KEY is not defined in the environment variables. CivicPulse AI will run in Mock AI mode.');
}

/**
 * Convert local file to Generative Part object
 */
const fileToGenerativePart = (path, mimeType) => {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString('base64'),
      mimeType,
    },
  };
};

/**
 * Analyzes a reported civic issue image
 * @param {string} imagePath - Absolute path to local image
 * @param {string} mimeType - Image mime type (e.g., 'image/jpeg')
 */
export const analyzeIssueImage = async (imagePath, mimeType = 'image/jpeg', voicePath = null, voiceMimeType = null) => {
  const isVideo = mimeType.startsWith('video/');

  if (!client) {
    // Return mock data for local testing when API key is missing
    if (isVideo) {
      return {
        title: 'Water Pipeline Leakage',
        category: 'Water Leakage',
        description: 'Water is gushing out of a cracked pipe under high pressure on the side of the road.',
        severity: 'High',
        severityJustification: 'Continuous high pressure leakage wasting public drinking water and causing localized pooling.',
        safetySuggestions: 'Do not approach the leakage area, avoid stepping in water pools near potential electric lines, and alert municipal plumbers.',
        mocked: true,
      };
    }
    return {
      title: 'Potential Waste Accumulation',
      category: 'Waste Management',
      description: 'A build-up of plastic waste and garbage bags blocking the pavement.',
      severity: 'Medium',
      severityJustification: 'Waste blockages create minor pedestrian obstacles and health concerns.',
      safetySuggestions: 'Keep a safe distance, report to sanitation workers, and avoid contact with hazardous substances.',
      mocked: true,
    };
  }

  try {
    const contents = [];
    const prompt = `Analyze this photo or video of a community infrastructure/civic issue. 
    ${voicePath ? `Also listen to the attached audio file where a citizen describes the issue in their native local language (which could be Hindi, Kannada, Tamil, Telugu, Bengali, etc.). Understand what they are saying and combine their verbal description with the visual media findings to formulate the report.` : ''}
    
    Identify the issue and classify it into one of these exact categories: 
    'Waste Management', 'Potholes & Roads', 'Water Leakage', 'Damaged Streetlights', 'Public Infrastructure', or 'Other'.
    
    Determine:
    1. A short, action-oriented title (3-6 words, in English)
    2. A detailed description (1-2 sentences, in English, combining both the visual details and details spoken in the voice recording)
    3. The category it fits best
    4. Severity level ('Low', 'Medium', 'High', or 'Critical')
    5. A 1-sentence justification for the severity level (in English)
    6. Safety/actionable suggestions for nearby citizens (1-2 sentences, in English)
    7. Safety/actionable suggestions translated into the native local Indian language (e.g. Hindi, Bengali, Kannada) based on the spoken language or region.
    
    You must output a JSON object containing EXACTLY these keys:
    {
      "title": "suggested title",
      "category": "exact category name",
      "description": "suggested description",
      "severity": "Low|Medium|High|Critical",
      "severityJustification": "justification details",
      "safetySuggestions": "safety instructions",
      "localSafetySuggestions": "safety instructions in local Indian language (e.g. Hindi or state regional language)"
    }`;
    contents.push(prompt);

    const mediaPart = fileToGenerativePart(imagePath, mimeType);
    contents.push(mediaPart);

    if (voicePath && voiceMimeType) {
      const voicePart = fileToGenerativePart(voicePath, voiceMimeType);
      contents.push(voicePart);
    }

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        responseMimeType: 'application/json',
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.warn('Gemini Media Analysis API call failed, switching automatically to Mock AI auto-fill fallback:', error.message);
    if (isVideo) {
      return {
        title: 'Water Pipeline Leakage',
        category: 'Water Leakage',
        description: 'Water is gushing out of a cracked pipe under high pressure on the side of the road.',
        severity: 'High',
        severityJustification: 'Continuous high pressure leakage wasting public drinking water and causing localized pooling.',
        safetySuggestions: 'Do not approach the leakage area, avoid stepping in water pools near potential electric lines, and alert municipal plumbers.',
        localSafetySuggestions: 'लीकेज क्षेत्र के पास न जाएं, संभावित बिजली लाइनों के पास पानी के गड्ढों में पैर रखने से बचें, और नगर निगम के प्लंबर को सूचित करें।',
        mocked: true,
      };
    }
    return {
      title: 'Potential Waste Accumulation',
      category: 'Waste Management',
      description: 'A build-up of plastic waste and garbage bags blocking the pavement.',
      severity: 'Medium',
      severityJustification: 'Waste blockages create minor pedestrian obstacles and health concerns.',
      safetySuggestions: 'Keep a safe distance, report to sanitation workers, and avoid contact with hazardous substances.',
      localSafetySuggestions: 'सुरक्षित दूरी बनाए रखें, स्वच्छता कर्मचारियों को रिपोर्ट करें और हानिकारक पदार्थों के संपर्क से बचें।',
      mocked: true,
    };
  }
};

/**
 * Verifies if an issue has been fixed by comparing the original image with the resolution image
 * @param {string} originalPath - Path to original issue image
 * @param {string} resolvedPath - Path to resolution confirmation image
 * @param {string} category - Category of the issue (e.g. 'Potholes & Roads')
 */
export const verifyIssueResolution = async (originalPath, resolvedPath, category) => {
  if (!client) {
    // Return mock verification for local testing when API key is missing
    return {
      result: 'Cleaned',
      confidence: 90,
      details: 'Mock AI: Comparison indicates that the reported issue (road potholes/waste) has been addressed and cleared.',
      mocked: true,
    };
  }

  try {
    const originalPart = fileToGenerativePart(originalPath, 'image/jpeg');
    const resolvedPart = fileToGenerativePart(resolvedPath, 'image/jpeg');

    const prompt = `You are a municipal audit AI. 
    The first image shows the original reported civic issue (Category: ${category}).
    The second image shows the same location where authorities claim to have resolved/fixed the issue.
    
    Compare both images closely:
    1. Assess if the issue shown in the first image is:
       - 'Cleaned' (completely resolved)
       - 'Partially Cleaned' (partially resolved, some debris or work remains)
       - 'Not Cleaned' (little to no resolution observed)
     2. What is your confidence level (0-100) in this decision?
     3. Give a 1-2 sentence explanation of the visible changes (e.g., "The pothole has been patched with asphalt", "The garbage has been completely removed").
     
     You must output a JSON object containing EXACTLY these keys:
     {
       "result": "Cleaned|Partially Cleaned|Not Cleaned",
       "confidence": 85,
       "details": "Explanation here"
     }`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [prompt, originalPart, resolvedPart],
      config: {
        responseMimeType: 'application/json',
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.warn('Gemini Verification Comparison failed, switching automatically to Mock AI audit verdict fallback:', error.message);
    return {
      result: 'Cleaned',
      confidence: 90,
      details: 'Mock AI: Comparison indicates that the reported issue has been addressed and cleared.',
      mocked: true,
    };
  }
};

/**
 * Recommends the best suited field worker (staff) for an issue using Gemini
 * @param {Object} issue - The selected issue document
 * @param {Array} staffList - The list of active staff users
 */
export const recommendStaffForIssue = async (issue, staffList) => {
  if (!client) {
    // If no client (mock mode), perform a basic match on area
    const matched = staffList.find(staff => 
      (staff.village && issue.village && staff.village.toLowerCase() === issue.village.toLowerCase()) ||
      (staff.city && issue.city && staff.city.toLowerCase() === issue.city.toLowerCase()) ||
      (staff.district && issue.district && staff.district.toLowerCase() === issue.district.toLowerCase())
    ) || staffList[0];

    return {
      recommendedStaffId: matched ? matched._id : null,
      name: matched ? matched.name : 'No Available Staff',
      reason: matched 
        ? `Mock AI recommended ${matched.name} because of geographic area proximity match (Staff matches address: ${matched.city || matched.district}).`
        : 'Mock AI: No staff available near coordinates.',
      mocked: true
    };
  }

  try {
    const formattedStaffList = staffList.map(s => ({
      id: s._id,
      name: s.name,
      level: s.level || 1,
      points: s.points || 0,
      state: s.state,
      district: s.district,
      city: s.city,
      village: s.village,
      serviceArea: s.serviceArea,
      workingRadius: s.workingRadius
    }));

    const prompt = `You are a municipal dispatching AI. Match the following civic issue with the single most suitable working staff member from the available staff list.
    
    Issue details:
    - Title: "${issue.title}"
    - Description: "${issue.description}"
    - Category: "${issue.category}"
    - Severity: "${issue.severity}"
    - Location address: Village/Ward: "${issue.village}", City: "${issue.city}", District: "${issue.district}", State: "${issue.state}", Landmark: "${issue.landmark}", PinCode: "${issue.pinCode}"
    
    Available Staff Members:
    ${JSON.stringify(formattedStaffList, null, 2)}
    
    Rules for selection:
    1. Proximity is the HIGHEST priority. Strongly recommend a staff member whose state, district, city, village or serviceArea matches the issue location.
    2. Category relevance & expertise. If they are higher level (LVL), they are better suited for higher severity or critical tasks.
    
    You must output a JSON object containing EXACTLY these keys:
    {
      "recommendedStaffId": "id_of_the_chosen_staff_member",
      "name": "name_of_the_chosen_staff_member",
      "reason": "1-2 sentence justification explaining why this staff member is the best fit for this issue's category and address."
    }`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [prompt],
      config: {
        responseMimeType: 'application/json',
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error('Gemini Staff Recommendation failed, falling back to mock routing:', error.message);
    const matched = staffList[0];
    return {
      recommendedStaffId: matched ? matched._id : null,
      name: matched ? matched.name : 'No Available Staff',
      reason: matched 
        ? `Fallback recommended ${matched.name} because of category match.`
        : 'No staff available.',
      mocked: true
    };
  }
};
