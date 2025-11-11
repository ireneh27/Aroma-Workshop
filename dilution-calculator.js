// Dilution Calculator Module
// Calculates dilution ratios and drop counts

const DilutionCalculator = {
    // Default drops per mL
    DEFAULT_DPM: 20,
    
    // Calculate drops needed for a given dilution
    calculate(totalMl, dilutionPct, dropsPerMl = this.DEFAULT_DPM) {
        if (!totalMl || !dilutionPct || !dropsPerMl) {
            return {
                eoMl: 0,
                drops: 0,
                message: '请输入总量和稀释浓度'
            };
        }
        
        const eoMl = totalMl * dilutionPct / 100;
        const drops = Math.round(eoMl * dropsPerMl);
        
        return {
            eoMl: eoMl,
            drops: drops,
            message: `${dilutionPct}% 的配方中：精油≈ ${eoMl.toFixed(2)} mL ≈ ${drops} 滴（按 ${dropsPerMl} 滴/mL）`
        };
    },
    
    // Get dilution reference ranges
    getReferenceRanges() {
        return [
            {range: '面部/敏感', min: 0.5, max: 1},
            {range: '全身日常', min: 1, max: 2},
            {range: '短期局部', min: 3, max: 5},
            {range: '香水/点涂', min: 5, max: 10, note: '注意个别油的上限'}
        ];
    },
    
    // Convert drops to mL (approximate)
    dropsToMl(drops, dropsPerMl = this.DEFAULT_DPM) {
        return drops / dropsPerMl;
    },
    
    // Convert mL to drops (approximate)
    mlToDrops(ml, dropsPerMl = this.DEFAULT_DPM) {
        return Math.round(ml * dropsPerMl);
    },
    
    // Calculate concentration from drops and total
    calculateConcentration(drops, totalMl, dropsPerMl = this.DEFAULT_DPM) {
        if (!totalMl || totalMl === 0) return 0;
        const eoMl = this.dropsToMl(drops, dropsPerMl);
        return (eoMl / totalMl) * 100;
    }
};

