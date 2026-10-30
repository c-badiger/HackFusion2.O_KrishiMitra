-- ==============================================================
-- Krishi Mitra (ಕೃಷಿ ಮಿತ್ರ) Verified Scheme Seed Data
-- Real Karnataka State & Central Agricultural Schemes
-- ==============================================================

USE `krishi_mitra_db`;

-- 1. Insert Government Schemes
INSERT INTO `government_schemes` 
(`id`, `scheme_code`, `name_en`, `name_kn`, `department_en`, `department_kn`, `category`, `level`, `benefit_type`, `benefit_amount_desc_en`, `benefit_amount_desc_kn`, `summary_en`, `summary_kn`, `application_portal`, `is_active`)
VALUES
(
  1,
  'KA-AGRI-RS-001',
  'Raitha Siri Scheme',
  'ರೈತ ಸಿರಿ ಯೋಜನೆ',
  'Department of Agriculture, Government of Karnataka',
  'ಕೃಷಿ ಇಲಾಖೆ, ಕರ್ನಾಟಕ ಸರ್ಕಾರ',
  'Direct Benefit Transfer',
  'Karnataka_State',
  'Direct_Benefit_Transfer',
  '₹10,000 per hectare (Max 2 hectares = ₹20,000) directly into Aadhaar-linked bank account.',
  'ಸಿರಿಧಾನ್ಯ ಬೆಳೆಯುವ ರೈತರಿಗೆ ಪ್ರತಿ ಹೆಕ್ಟೇರ್‌ಗೆ ₹10,000 (ಗರಿಷ್ಠ 2 ಹೆಕ್ಟೇರ್‌ಗೆ ₹20,000) ನೇರ ನಗದು ವರ್ಗಾವಣೆ.',
  'Promotes cultivation of minor millets (Ragi, Foxtail, Kodo, Little, Barnyard, Proso millet) in Karnataka by providing input financial assistance.',
  'ಕರ್ನಾಟಕದಲ್ಲಿ ಸಿರಿಧಾನ್ಯಗಳಾದ ರಾಗಿ, ನವಣೆ, ಸಾಮೆ, ಹಾರಕ, ಕೊರಲೆ, ಬರಗು ಬೆಳೆಯುವ ರೈತರನ್ನು ಪ್ರೋತ್ಸಾಹಿಸಲು ಆರ್ಥಿಕ ನೆರವು.',
  'https://fruits.karnataka.gov.in',
  1
),
(
  2,
  'KA-AGRI-KB-002',
  'Krishi Bhagya Scheme',
  'ಕೃಷಿ ಭಾಗ್ಯ ಯೋಜನೆ',
  'Department of Agriculture, Government of Karnataka',
  'ಕೃಷಿ ಇಲಾಖೆ, ಕರ್ನಾಟಕ ಸರ್ಕಾರ',
  'Water Harvesting & Subsidy',
  'Karnataka_State',
  'Subsidy_Capital',
  'Up to 80% to 90% capital subsidy for farm pond (Krishi Honda) construction, polythene lining, and diesel pumpsets.',
  'ಕೃಷಿ ಹೊಂಡ ನಿರ್ಮಾಣ, ಪಾಲಿಥೀನ್ ಹೊದಿಕೆ ಮತ್ತು ಡೀಸೆಲ್ ಪಂಪ್‌ಸೆಟ್‌ಗಳಿಗೆ 80% ರಿಂದ 90% ರವರೆಗೆ ಸಹಾಯಧನ.',
  'Designed for dryland agriculture farmers in rainfed regions to secure rainwater harvesting through farm ponds and micro-irrigation.',
  'ಮಳೆಯಾಶ್ರಿತ ಪ್ರದೇಶಗಳ ರೈತರಿಗೆ ಮಳೆ ನೀರು ಕೊಯ್ಲು, ಕೃಷಿ ಹೊಂಡ ನಿರ್ಮಾಣ ಮತ್ತು ತುಂತುರು ನೀರಾವರಿ ಮೂಲಕ ರಕ್ಷಣಾತ್ಮಕ ನೀರು ಒದಗಿಸುವ ಮಹತ್ವಾಕಾಂಕ್ಷೆಯ ಯೋಜನೆ.',
  'https://raitamitra.karnataka.gov.in',
  1
),
(
  3,
  'KA-WEL-GK-003',
  'Ganga Kalyana Scheme',
  'ಗಂಗಾ ಕಲ್ಯಾಣ ಯೋಜನೆ',
  'Department of Social Welfare & Backward Classes, Karnataka',
  'ಸಮಾಜ ಕಲ್ಯಾಣ ಹಾಗೂ ಹಿಂದುಳಿದ ವರ್ಗಗಳ ಕಲ್ಯಾಣ ಇಲಾಖೆ',
  'Irrigation Infrastructure',
  'Karnataka_State',
  'In_Kind',
  '100% free borewell drilling, casing pipe, pump installation, and electrification for eligible small farmers.',
  'ಅರ್ಹ ಸಣ್ಣ ರೈತರಿಗೆ ಉಚಿತ ಬೋರ್‌ವೆಲ್ ಕೊರೆಯುವಿಕೆ, ಪಂಪ್ ಅಳವಡಿಕೆ ಮತ್ತು ಉಚಿತ ವಿದ್ಯುದ್ದೀಕರಣ ಸೌಲಭ್ಯ (ಸಂಪೂರ್ಣ ಉಚಿತ).',
  'Provides individual and collective irrigation facilities for small and marginal farmers belonging to SC, ST, and OBC communities.',
  'ಪರಿಶಿಷ್ಟ ಜಾತಿ, ಪರಿಶಿಷ್ಟ ಪಂಗಡ ಮತ್ತು ಹಿಂದುಳಿದ ವರ್ಗಗಳ ಸಣ್ಣ ಹಾಗೂ ಅತಿ ಸಣ್ಣ ರೈತರ ಜಮೀನುಗಳಿಗೆ ಶಾಶ್ವತ ನೀರಾವರಿ ಒದಗಿಸಲು ಉಚಿತ ಬೋರ್‌ವೆಲ್ ಸೌಲಭ್ಯ.',
  'https://kstdc.karnataka.gov.in',
  1
),
(
  4,
  'CENT-PM-KISAN-004',
  'PM-KISAN Samman Nidhi',
  'ಪಿಎಂ-ಕಿಸಾನ್ ಸಮ್ಮಾನ್ ನಿಧಿ',
  'Ministry of Agriculture & Farmers Welfare, GoI',
  'ಕೃಷಿ ಮತ್ತು ರೈತರ ಕಲ್ಯಾಣ ಸಚಿವಾಲಯ, ಭಾರತ ಸರ್ಕಾರ',
  'Income Support',
  'Central_Government',
  'Direct_Benefit_Transfer',
  '₹6,000 per year paid in three four-monthly installments of ₹2,000 directly to bank accounts.',
  'ವರ್ಷಕ್ಕೆ ₹6,000 ಆರ್ಥಿಕ ನೆರವು, ತಲಾ ₹2,000 ರಂತೆ 3 ಕಂತುಗಳಲ್ಲಿ ರೈತರ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಜಮಾ.',
  'Income support scheme providing assured financial assistance to all landholding farmer families across the country for agricultural inputs.',
  'ದೇಶದ ಎಲ್ಲಾ ಭೂಮಾಲೀಕ ರೈತ ಕುಟುಂಬಗಳಿಗೆ ಕೃಷಿ ವೆಚ್ಚ ಹಾಗೂ ಕಟಾವು ಅಗತ್ಯಗಳಿಗಾಗಿ ವಾರ್ಷಿಕ ₹6,000 ನೇರ ಆದಾಯ ಬೆಂಬಲ.',
  'https://pmkisan.gov.in',
  1
),
(
  5,
  'CENT-PMFBY-005',
  'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
  'ಪ್ರಧಾನ ಮಂತ್ರಿ ಫಸಲ್ ಬಿಮಾ ಯೋಜನೆ',
  'Department of Agriculture & Farmers Welfare',
  'ಕೃಷಿ ಇಲಾಖೆ ಹಾಗೂ ಬೆಳೆ ವಿಮಾ ಪೋರ್ಟಲ್',
  'Crop Insurance',
  'Central_Government',
  'Insurance',
  'Full sum insured against yield loss and post-harvest calamity. Farmer pays nominal premium (2% Kharif, 1.5% Rabi).',
  'ಬೆಳೆ ಹಾನಿಗೆ ಸಂಪೂರ್ಣ ಪರಿಹಾರ. ರೈತರು ಕೇವಲ 2% (ಖಾರಿಫ್) ಅಥವಾ 1.5% (ರಬಿ) ಮಾತ್ರ ಪ್ರೀಮಿಯಂ ಪಾವತಿಸಬೇಕು.',
  'Comprehensive crop insurance policy covering non-preventable natural risks from pre-sowing to post-harvest stages.',
  'ಬರ, ನೆರೆ, ಕೀಟಬಾಧೆ ಹಾಗೂ ಅಕಾಲಿಕ ಮಳೆಯಿಂದ ಬೆಳೆ ನಷ್ಟವಾದರೆ ರೈತರಿಗೆ ಶೀಘ್ರ ಆರ್ಥಿಕ ಪರಿಹಾರ ಒದಗಿಸುವ ಸಮಗ್ರ ವಿಮೆ.',
  'https://samrakshane.karnataka.gov.in',
  1
),
(
  6,
  'KA-EDU-RVN-006',
  'Chief Minister Raita Vidya Nidhi',
  'ಮುಖ್ಯಮಂತ್ರಿ ರೈತ ವಿದ್ಯಾನಿಧಿ ಯೋಜನೆ',
  'Department of Agriculture, Karnataka',
  'ಕೃಷಿ ಇಲಾಖೆ, ಕರ್ನಾಟಕ ಸರ್ಕಾರ',
  'Education Support',
  'Karnataka_State',
  'Direct_Benefit_Transfer',
  'Scholarship ranging from ₹2,000 to ₹11,000 per year for farmer children pursuing post-matric/higher degrees.',
  'ರೈತರ ಮಕ್ಕಳಿಗೆ ಪಿಯುಸಿ, ಪದವಿ, ಸ್ನಾತಕೋತ್ತರ ವ್ಯಾಸಂಗಕ್ಕೆ ವಾರ್ಷಿಕ ₹2,000 ದಿಂದ ₹11,000 ವರೆಗೆ ವಿದ್ಯಾರ್ಥಿವೇತನ.',
  'Encourages education among children of landholding farmers across Karnataka.',
  'ರೈತರ ಮಕ್ಕಳು ಉನ್ನತ ಶಿಕ್ಷಣ ಪಡೆಯಲು ಅನುಕೂಲವಾಗುವಂತೆ ಶಿಕ್ಷಣ ಪ್ರೋತ್ಸಾಹಧನ.',
  'https://fruits.karnataka.gov.in',
  1
);

-- 2. Insert Deterministic Eligibility Rules
INSERT INTO `scheme_eligibility_rules`
(`scheme_id`, `rule_code`, `parameter_name`, `operator`, `target_value`, `is_mandatory`, `explanation_kn`, `explanation_en`)
VALUES
-- Rules for Raitha Siri (Scheme 1)
(1, 'RS_CROP_MILLET', 'crop_category', 'CONTAINS', 'Siridhanya_Millet', 1, 'ರೈತರು ಸಿರಿಧಾನ್ಯಗಳನ್ನು (ರಾಗಿ, ಜೋಳ, ನವಣೆ ಇತ್ಯಾದಿ) ಬೆಳೆದಿರಬೇಕು.', 'Must cultivate recognized millet crops.'),
(1, 'RS_MAX_LAND', 'total_land_acres', '<=', '5.0', 0, 'ಸಣ್ಣ ಮತ್ತು ಮಧ್ಯಮ ಹಿಡುವಳಿದಾರರಿಗೆ ಆದ್ಯತೆ ನೀಡಲಾಗುತ್ತದೆ.', 'Preference for small and marginal landholders.'),

-- Rules for Krishi Bhagya (Scheme 2)
(2, 'KB_IRRIGATION_RAINFED', 'irrigation_type', 'IN', '["Rainfed", "Dryland"]', 1, 'ಜಮೀನು ಮಳೆಯಾಶ್ರಿತ ಅಥವಾ ಒಣಭೂಮಿ ಪ್ರದೇಶದಲ್ಲಿರಬೇಕು.', 'Land must be situated in rainfed or dryland zone.'),
(2, 'KB_MIN_LAND', 'total_land_acres', '>=', '1.0', 1, 'ಕೃಷಿ ಹೊಂಡ ನಿರ್ಮಾಣಕ್ಕೆ ಕನಿಷ್ಠ 1 ಎಕರೆ ಜಮೀನು ಇರಬೇಕು.', 'Must hold at least 1 acre for farm pond.'),

-- Rules for Ganga Kalyana (Scheme 3)
(3, 'GK_CASTE_RESTRICTION', 'caste_category', 'IN', '["SC", "ST", "OBC"]', 1, 'ಅರ್ಜಿದಾರರು SC, ST ಅಥವಾ ಹಿಂದುಳಿದ ವರ್ಗಗಳಿಗೆ ಸೇರಿದವರಾಗಿರಬೇಕು.', 'Applicant must belong to SC, ST or recognized Backward Class.'),
(3, 'GK_MAX_INCOME', 'annual_income', '<=', '200000', 1, 'ವಾರ್ಷಿಕ ಆದಾಯ ₹2,00,000 ಮೀರಬಾರದು.', 'Annual family income must not exceed ₹2,00,000.'),
(3, 'GK_NO_EXISTING_BOREWELL', 'has_borewell', '=', 'false', 1, 'ಜಮೀನಿನಲ್ಲಿ ಈ ಮೊದಲೇ ಯಾವುದೇ ಬೋರ್‌ವೆಲ್ ಇರಬಾರದು.', 'Must not have an existing functional borewell on the holding.'),
(3, 'GK_MIN_LAND', 'total_land_acres', '>=', '1.5', 1, 'ಕನಿಷ್ಠ 1.5 ಎಕರೆ ಖುಷ್ಕಿ/ಜಮೀನು ಇರಬೇಕು.', 'Must have at least 1.5 acres land holding.'),

-- Rules for PM-KISAN (Scheme 4)
(4, 'PMK_LAND_OWNERSHIP', 'total_land_acres', '>', '0.0', 1, 'ಅರ್ಜಿದಾರರ ಹೆಸರಿನಲ್ಲಿ ಸಾಗುವಳಿ ಮಾಡಬಹುದಾದ ಜಮೀನು ಇರಬೇಕು.', 'Must own cultivable agricultural land.'),

-- Rules for PMFBY (Scheme 5)
(5, 'PMFBY_NOTIFIED_CROP', 'crop_category', 'IN', '["Siridhanya_Millet", "Cereal", "Pulse", "Oilseed", "Cash_Crop"]', 1, 'ಅಧಿಸೂಚಿತ ಕೃಷಿ ಬೆಳೆಗಳನ್ನು ಬೆಳೆದಿರಬೇಕು.', 'Must cultivate notified food, oilseed or commercial crops.');

-- 3. Insert Required Scheme Documents
INSERT INTO `scheme_documents`
(`scheme_id`, `document_name_en`, `document_name_kn`, `is_mandatory`, `issuing_authority_kn`)
VALUES
-- Documents for Raitha Siri
(1, 'RTC / Pahani', 'ಪಹಣಿ (RTC)', 1, 'ಕಂದಾಯ ಇಲಾಖೆ (Revenue Dept)'),
(1, 'Aadhaar Card', 'ಆಧಾರ್ ಕಾರ್ಡ್', 1, 'UIDAI'),
(1, 'Aadhaar-seeded Bank Passbook', 'ಆಧಾರ್ ಜೋಡಣೆಯಾದ ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್', 1, 'ವಾಣಿಜ್ಯ / ಗ್ರಾಮೀಣ ಬ್ಯಾಂಕ್'),
(1, 'FRUITS Farmer Registration Card', 'FRUITS ಗುರುತಿನ ಸಂಖ್ಯೆ (FID)', 1, 'ಕೃಷಿ ಇಲಾಖೆ'),

-- Documents for Krishi Bhagya
(2, 'RTC / Land Records', 'ಪಹಣಿ (RTC)', 1, 'ಕಂದಾಯ ಇಲಾಖೆ'),
(2, 'Aadhaar Card', 'ಆಧಾರ್ ಕಾರ್ಡ್', 1, 'UIDAI'),
(2, 'Land Sketch / Map', 'ಜಮೀನಿನ ನಕ್ಷೆ', 1, 'ಸರ್ವೇ ಇಲಾಖೆ'),
(2, 'Bank Account Details', 'ಬ್ಯಾಂಕ್ ಖಾತೆ ವಿವರ', 1, 'ಬ್ಯಾಂಕ್'),

-- Documents for Ganga Kalyana
(3, 'Caste & Income Certificate with RD Number', 'RD ಸಂಖ್ಯೆ ಇರುವ ಜಾತಿ ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ', 1, 'ಕಂದಾಯ ಇಲಾಖೆ / ನಾಡಕಚೇರಿ'),
(3, 'RTC (Last 3 years)', 'ಕಳೆದ 3 ವರ್ಷಗಳ ಪಹಣಿ (RTC)', 1, 'ಕಂದಾಯ ಇಲಾಖೆ'),
(3, 'Aadhaar Card', 'ಆಧಾರ್ ಕಾರ್ಡ್', 1, 'UIDAI'),
(3, 'No-Borewell Certificate', 'ಜಮೀನಿನಲ್ಲಿ ಬೋರ್‌ವೆಲ್ ಇಲ್ಲದಿರುವ ಬಗ್ಗೆ ದೃಢೀಕರಣ', 1, 'ಗ್ರಾಮ ಆಡಳಿತ ಅಧಿಕಾರಿ (VAO)'),

-- Documents for PM-KISAN
(4, 'Land Ownership Record (RTC)', 'ಪಹಣಿ (RTC)', 1, 'ಕಂದಾಯ ಇಲಾಖೆ'),
(4, 'Aadhaar Card', 'ಆಧಾರ್ ಕಾರ್ಡ್', 1, 'UIDAI'),
(4, 'Bank Account with NPCI mapping', 'NPCI ಲಿಂಕ್ ಆದ ಬ್ಯಾಂಕ್ ಖಾತೆ', 1, 'ಬ್ಯಾಂಕ್'),

-- Documents for PMFBY
(5, 'Crop Sowing Certificate / RTC Sown Crop Entry', 'ಬಿತ್ತನೆ ದೃಢೀಕರಣ ಪತ್ರ / ಪಹಣಿ', 1, 'ಗ್ರಾಮ ಲೆಕ್ಕಿಗ / RSK'),
(5, 'Bank Passbook / Loan Sanction Letter', 'ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್', 1, 'ಬ್ಯಾಂಕ್');
