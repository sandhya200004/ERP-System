import { Injectable } from '@nestjs/common';

interface Task {
  id: string;
  estimated_hours: number;
  actual_hours: number;
  started_at: Date;
  completed_at: Date;
  due_date: Date;
  complexity: 'trivial' | 'small' | 'medium' | 'complex' | 'critical';
  proofs: any[];
  auto_checks: any;
  required_checks: number;
  peer_reviews: any[];
  quality_score: number | null;
  created_at: Date;
  task_score?: number | null;
}

interface ComplexityMultiplier {
  trivial: number;
  small: number;
  medium: number;
  complex: number;
  critical: number;
}

@Injectable()
export class KpiScoreService {
  private readonly complexityMultiplier: ComplexityMultiplier = {
    trivial: 0.8,
    small: 1.0,
    medium: 1.2,
    complex: 1.4,
    critical: 1.6,
  };

  private readonly weights = {
    timeliness: 0.25,
    quality: 0.35,
    effort: 0.15,
    peer: 0.15,
    auto: 0.10,
  };

  /**
   * Compute Timeliness Score (0-100)
   * 100 if completed before deadline, else penalized by lateness
   */
  computeTimeliness(task: Task): number {
    if (!task.completed_at || !task.due_date) return 0;

    const completed = new Date(task.completed_at).getTime();
    const deadline = new Date(task.due_date).getTime();

    if (completed <= deadline) {
      return 100;
    }

    const lateMs = completed - deadline;
    const lateHours = lateMs / (1000 * 60 * 60);
    const estimatedHours = task.estimated_hours || 1;
    const latenessFactor = 1.5; // Penalty multiplier

    const score = Math.max(0, 100 - ((lateHours / estimatedHours) * 100 * latenessFactor));
    return score;
  }

  /**
   * Compute Effort Accuracy Score (0-100)
   * Optimal range: 0.8 to 1.25 of estimated hours
   */
  computeEffortAccuracy(estimatedHours: number, actualHours: number): number {
    if (!estimatedHours || estimatedHours <= 0) return 0;
    if (!actualHours || actualHours <= 0) return 0;

    const ratio = actualHours / estimatedHours;

    if (ratio >= 0.8 && ratio <= 1.25) {
      return 100;
    }

    if (ratio < 0.8) {
      return Math.max(40, 100 * (ratio / 0.8));
    }

    // ratio > 1.25
    return Math.max(50, 100 * (1.25 / ratio));
  }

  /**
   * Compute Auto Verification Score (0-100)
   * Based on completed checks vs required checks
   */
  computeAutoVerification(autoChecks: any, requiredChecks: number): number {
    if (!requiredChecks || requiredChecks === 0) return 100;

    const completedChecks = Object.values(autoChecks || {}).filter(Boolean).length;
    return (completedChecks / requiredChecks) * 100;
  }

  /**
   * Compute Peer Review Score (0-100)
   * Average of all peer ratings
   */
  computePeerScore(peerReviews: any[]): number {
    if (!peerReviews || peerReviews.length === 0) return 0;

    const scores = peerReviews
      .filter(review => typeof review.score === 'number')
      .map(review => review.score);

    if (scores.length === 0) return 0;

    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.min(100, Math.max(0, average));
  }

  /**
   * Detect gaming patterns and return penalty percentage (0-0.2)
   */
  detectGamingPatterns(task: Task): number {
    let penaltyReasons: string[] = [];

    // 1. Task marked complete in < 5% of estimated hours
    if (task.estimated_hours && task.actual_hours) {
      if (task.actual_hours < task.estimated_hours * 0.05) {
        penaltyReasons.push('Too fast completion vs estimate');
      }
    }

    // 2. Completion < 5 minutes after start
    if (task.started_at && task.completed_at) {
      const durationMs = new Date(task.completed_at).getTime() - new Date(task.started_at).getTime();
      const durationMinutes = durationMs / (1000 * 60);
      
      if (durationMinutes < 5 && task.estimated_hours && task.estimated_hours > 0.5) {
        penaltyReasons.push('Completed in less than 5 minutes');
      }
    }

    // 3. Missing required proofs for medium+ complexity
    const mediumOrHigher = ['medium', 'complex', 'critical'].includes(task.complexity);
    if (mediumOrHigher) {
      const proofsCount = (task.proofs || []).length;
      if (proofsCount === 0) {
        penaltyReasons.push('Missing proofs for complex task');
      }
    }

    // 4. Complex task done unrealistically fast
    if (task.complexity === 'complex' || task.complexity === 'critical') {
      if (task.actual_hours && task.estimated_hours) {
        if (task.actual_hours < task.estimated_hours * 0.3) {
          penaltyReasons.push('Complex task completed too quickly');
        }
      }
    }

    // Return penalty if any reasons found
    return penaltyReasons.length > 0 ? 0.2 : 0;
  }

  /**
   * Clamp value between min and max
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Main function: Compute overall task score (0-100)
   */
  computeTaskScore(task: Task): { score: number; breakdown: { timeliness: number; quality: number; effort: number; peer: number; auto: number; gamingPenaltyPct: number } } {
    const T = this.computeTimeliness(task);
    const Q = task.quality_score || 0;
    const E = this.computeEffortAccuracy(task.estimated_hours, task.actual_hours);
    const P = this.computePeerScore(task.peer_reviews);
    const A = this.computeAutoVerification(task.auto_checks, task.required_checks);

    const baseScore =
      this.weights.timeliness * T +
      this.weights.quality * Q +
      this.weights.effort * E +
      this.weights.peer * P +
      this.weights.auto * A;

    const complexityMult = this.complexityMultiplier[task.complexity] || 1.0;
    const penalty = this.detectGamingPatterns(task);

    const finalScore = this.clamp(baseScore * complexityMult - penalty * 100, 0, 100);

    return {
      score: Math.round(finalScore * 100) / 100,
      breakdown: {
        timeliness: T,
        quality: Q,
        effort: E,
        peer: P,
        auto: A,
        gamingPenaltyPct: penalty,
      },
    };
  }

  /**
   * Compute Employee KPI from multiple tasks
   * Monthly weighted average with recency and complexity weights
   */
  computeEmployeeKPI(tasks: Task[]): number {
    if (!tasks || tasks.length === 0) return 0;

    const now = Date.now();
    let weightedSum = 0;
    let totalWeight = 0;

    for (const task of tasks) {
      if (!task.completed_at) continue;

      const taskScore = task.task_score || this.computeTaskScore(task).score;
      const complexityWeight = this.complexityMultiplier[task.complexity] || 1.0;

      // Recency weight: tasks in last 30 days weighted more
      const daysSinceTask = (now - new Date(task.completed_at).getTime()) / (1000 * 60 * 60 * 24);
      const recencyWeight = 1 / (1 + daysSinceTask / 30);

      const weight = complexityWeight * recencyWeight;
      weightedSum += taskScore * weight;
      totalWeight += weight;
    }

    if (totalWeight === 0) return 0;

    return Math.round((weightedSum / totalWeight) * 100) / 100;
  }

  /**
   * Role-normalized KPI score
   * z = (employee_score - role_mean) / role_stddev
   * normalized = 50 + 10*z
   */
  normalizeByRole(employeeScore: number, roleMean: number, roleStdDev: number): number {
    if (roleStdDev === 0) return 50;

    const z = (employeeScore - roleMean) / roleStdDev;
    const normalized = 50 + 10 * z;

    return Math.round(this.clamp(normalized, 0, 100) * 100) / 100;
  }

  /**
   * Calculate role statistics (mean and std deviation)
   */
  calculateRoleStats(
    employeeScores: Array<{ employee_id: string; role: string; score: number }>,
    role: string,
  ): { mean: number; stdDev: number; count: number } {
    const roleScores = employeeScores
      .filter((e) => e.role === role)
      .map((e) => e.score)
      .filter((score) => typeof score === 'number' && !isNaN(score));

    if (roleScores.length === 0) {
      return { mean: 0, stdDev: 0, count: 0 };
    }

    const mean = roleScores.reduce((sum, score) => sum + score, 0) / roleScores.length;

    const variance =
      roleScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) /
      roleScores.length;
    const stdDev = Math.sqrt(variance);

    return {
      mean: Math.round(mean * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100,
      count: roleScores.length,
    };
  }
}
