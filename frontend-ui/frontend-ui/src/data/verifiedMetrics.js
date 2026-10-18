/**
 * VERIFIED EVALUATION METRICS
 * Source: ml/models/evaluation_report.txt
 * Generated during training on held-out CIC-IDS2017 test split (504,160 records).
 * Strictly ground-truth data — DO NOT edit or fabricate metrics.
 */

export const VERIFIED_METRICS = {
  sourceFile: "ml/models/evaluation_report.txt",
  testDataset: "CIC-IDS2017 (held-out X_test.csv, y_test.csv)",
  totalTestRecords: 504160,
  trainingMaxPerClass: 20000,
  randomState: 42,
  nEstimators: 100,
  classWeight: "balanced_subsample",
  overallAccuracy: 0.9972,
  overallAccuracyPercent: 99.72,

  macroAvg: {
    precision: 0.83,
    recall: 0.86,
    f1Score: 0.83,
    support: 504160,
  },

  weightedAvg: {
    precision: 1.00,
    recall: 1.00,
    f1Score: 1.00,
    support: 504160,
  },

  classes: [
    { name: "BENIGN", precision: 1.00, recall: 1.00, f1Score: 1.00, support: 419012, category: "Legitimate" },
    { name: "Bot", precision: 0.48, recall: 0.99, f1Score: 0.65, support: 390, category: "Malware" },
    { name: "DDoS", precision: 1.00, recall: 1.00, f1Score: 1.00, support: 25603, category: "DoS" },
    { name: "DoS GoldenEye", precision: 0.97, recall: 1.00, f1Score: 0.98, support: 2057, category: "DoS" },
    { name: "DoS Hulk", precision: 0.99, recall: 1.00, f1Score: 1.00, support: 34569, category: "DoS" },
    { name: "DoS Slowhttptest", precision: 0.93, recall: 1.00, f1Score: 0.96, support: 1046, category: "DoS" },
    { name: "DoS slowloris", precision: 0.99, recall: 0.99, f1Score: 0.99, support: 1077, category: "DoS" },
    { name: "FTP-Patator", precision: 1.00, recall: 1.00, f1Score: 1.00, support: 1186, category: "Brute Force" },
    { name: "Heartbleed", precision: 1.00, recall: 0.50, f1Score: 0.67, support: 2, category: "Vulnerability" },
    { name: "Infiltration", precision: 0.88, recall: 1.00, f1Score: 0.93, support: 7, category: "Lateral" },
    { name: "PortScan", precision: 0.99, recall: 1.00, f1Score: 0.99, support: 18139, category: "Reconnaissance" },
    { name: "SSH-Patator", precision: 0.98, recall: 1.00, f1Score: 0.99, support: 644, category: "Brute Force" },
    { name: "Web Attack – Brute Force", precision: 0.58, recall: 0.83, f1Score: 0.68, support: 294, category: "Web Attack" },
    { name: "Web Attack – Sql Injection", precision: 0.33, recall: 0.25, f1Score: 0.29, support: 4, category: "Web Attack" },
    { name: "Web Attack – XSS", precision: 0.32, recall: 0.32, f1Score: 0.32, support: 130, category: "Web Attack" },
  ],

  // 15x15 Confusion matrix directly matching report lines 26 to 55
  confusionMatrixLabels: [
    "BENIGN", "Bot", "DDoS", "DoS GoldenEye", "DoS Hulk", "DoS Slowhttptest", "DoS slowloris",
    "FTP-Patator", "Heartbleed", "Infiltration", "PortScan", "SSH-Patator",
    "Web Attack – BF", "Web Attack – SQLi", "Web Attack – XSS"
  ],

  confusionMatrix: [
    [417816, 410, 57, 48, 269, 73, 8, 2, 0, 1, 198, 10, 82, 2, 36],
    [4, 386, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [5, 0, 25595, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 2054, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [17, 0, 2, 11, 34534, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1042, 4, 0, 0, 0, 0, 0, 0, 0, 0],
    [4, 0, 0, 0, 0, 4, 1067, 0, 0, 0, 1, 0, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1185, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 0, 0],
    [11, 0, 0, 0, 4, 0, 0, 0, 0, 0, 18120, 0, 3, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 644, 0, 0, 0],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 243, 0, 49],
    [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1, 0],
    [1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 86, 0, 41]
  ],
};
