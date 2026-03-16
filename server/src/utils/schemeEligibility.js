const SCHEMES = [
  {
    id: 'NSP_SC_ST',
    name: 'National Scholarship Portal - SC/ST',
    portalUrl: 'https://scholarships.gov.in/',
    rules: { minSPI: 600, categories: ['SC', 'ST'], maxAge: 18 }
  },
  {
    id: 'INSPIRE_AWARD',
    name: 'INSPIRE Award (DST)',
    portalUrl: 'https://online-inspire.gov.in/',
    rules: { minSPI: 750, achievementCount: 2 }
  },
  {
    id: 'NMMS',
    name: 'National Means-cum-Merit Scholarship',
    portalUrl: 'https://scholarships.gov.in/',
    rules: { minSPI: 700, maxFamilyIncome: 150000 }
  }
];

const asNumber = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const clamp100 = (value) => Math.max(0, Math.min(100, asNumber(value)));

const evaluateSingleScheme = (scheme, profile) => {
  const reasons = [];
  const rules = scheme.rules || {};

  if (rules.minSPI !== undefined && asNumber(profile.spiTotal) < asNumber(rules.minSPI)) {
    reasons.push(`Requires minimum SPI ${rules.minSPI}`);
  }

  if (rules.categories?.length) {
    const studentCategory = String(profile.category || '').toUpperCase();
    const allowed = rules.categories.map((item) => String(item).toUpperCase());
    if (!allowed.includes(studentCategory)) {
      reasons.push(`Category must be one of: ${allowed.join(', ')}`);
    }
  }

  if (rules.maxAge !== undefined && asNumber(profile.age) > asNumber(rules.maxAge)) {
    reasons.push(`Maximum age allowed is ${rules.maxAge}`);
  }

  if (
    rules.maxFamilyIncome !== undefined &&
    profile.familyIncome !== null &&
    profile.familyIncome !== undefined &&
    asNumber(profile.familyIncome) > asNumber(rules.maxFamilyIncome)
  ) {
    reasons.push(`Family income must be <= ${rules.maxFamilyIncome}`);
  }

  if (rules.achievementCount !== undefined && asNumber(profile.achievementCount) < asNumber(rules.achievementCount)) {
    reasons.push(`Requires at least ${rules.achievementCount} approved achievements`);
  }

  const requiredSPI = asNumber(rules.minSPI, 0);
  const currentSPI = asNumber(profile.spiTotal, 0);
  const gap = Math.max(0, requiredSPI - currentSPI);

  let recommendation = 'not-eligible';
  if (reasons.length === 0) recommendation = 'eligible';
  else if (gap > 0 && gap <= 50) recommendation = 'almost-there';

  return {
    schemeId: scheme.id,
    schemeName: scheme.name,
    portalUrl: scheme.portalUrl,
    eligible: reasons.length === 0,
    recommendation,
    requiredSPI,
    currentSPI,
    progressPercent: requiredSPI > 0 ? clamp100((currentSPI / requiredSPI) * 100) : 100,
    reason: reasons.length ? reasons.join('; ') : 'Eligible based on current profile'
  };
};

export const evaluateEligibility = (studentProfile) => SCHEMES.map((scheme) => evaluateSingleScheme(scheme, studentProfile));

export { SCHEMES };
