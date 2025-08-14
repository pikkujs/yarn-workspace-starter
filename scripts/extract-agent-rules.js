#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

/**
 * Extracts all CRITICAL rules and important patterns from agent markdown files
 */
class AgentRuleExtractor {
  constructor(agentDir) {
    this.agentDir = agentDir
    this.rules = []
  }

  extractRules() {
    const files = this.getAllMarkdownFiles(this.agentDir)
    
    for (const file of files) {
      const content = readFileSync(file, 'utf-8')
      const rules = this.parseRulesFromMarkdown(content, file)
      this.rules.push(...rules)
    }

    return this.rules
  }

  getAllMarkdownFiles(dir) {
    const files = []
    const items = readdirSync(dir)

    for (const item of items) {
      const fullPath = join(dir, item)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        files.push(...this.getAllMarkdownFiles(fullPath))
      } else if (extname(item) === '.md') {
        files.push(fullPath)
      }
    }

    return files
  }

  parseRulesFromMarkdown(content, filename) {
    const rules = new Set() // Use Set to avoid duplicates
    const lines = content.split('\n')
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Extract CRITICAL rules
      if (line.includes('**CRITICAL**') || line.includes('CRITICAL:')) {
        const rule = this.extractRule(lines, i, 'CRITICAL')
        if (rule) {
          rules.add(JSON.stringify({ ...rule, file: filename, type: 'CRITICAL' }))
        }
      }
      
      // Extract specific important patterns
      if (line.match(/^- No manual.*auth.*check/i)) {
        rules.add(JSON.stringify({
          rule: line.replace(/^- /, ''),
          file: filename,
          type: 'CRITICAL',
          line: i + 1
        }))
      }
      
      // Extract rules marked with specific patterns
      if (line.match(/^- \*\*CRITICAL\*\*/)) {
        rules.add(JSON.stringify({
          rule: line.replace(/^- \*\*CRITICAL\*\*:?\s*/, ''),
          file: filename,
          type: 'CRITICAL',
          line: i + 1
        }))
      }
      
      // Extract rules from "Rules" sections
      if (line.match(/^\*\*Rules\*\*/) || line.match(/^## .*Rules/)) {
        const sectionRules = this.extractRulesFromSection(lines, i)
        sectionRules.forEach(r => {
          rules.add(JSON.stringify({ ...r, file: filename }))
        })
      }
      
      // Extract checklist items
      if (line.match(/^- \[ \] \*\*CRITICAL\*\*/)) {
        rules.add(JSON.stringify({
          rule: line.replace(/^- \[ \] \*\*CRITICAL\*\*:?\s*/, ''),
          file: filename,
          type: 'CHECKLIST_CRITICAL',
          line: i + 1
        }))
      }
      
      // Extract bullet points that mention critical patterns
      if (line.match(/^- .*must.*destructur/i) || line.match(/^- .*never.*import.*directly/i)) {
        rules.add(JSON.stringify({
          rule: line.replace(/^- /, ''),
          file: filename,
          type: 'CRITICAL',
          line: i + 1
        }))
      }
    }

    return Array.from(rules).map(r => JSON.parse(r))
  }

  extractRule(lines, startIndex, type) {
    const line = lines[startIndex]
    
    // Single line rule
    if (line.includes(':')) {
      const rulePart = line.split(':').slice(1).join(':').trim()
      if (rulePart) {
        return {
          rule: rulePart,
          line: startIndex + 1
        }
      }
    }
    
    // Multi-line rule - look for the next few lines
    let rule = line.replace(/\*\*CRITICAL\*\*:?\s*/g, '').trim()
    for (let j = startIndex + 1; j < Math.min(startIndex + 3, lines.length); j++) {
      const nextLine = lines[j].trim()
      if (!nextLine || nextLine.startsWith('#') || nextLine.startsWith('-')) {
        break
      }
      rule += ' ' + nextLine
    }
    
    return rule ? { rule: rule.trim(), line: startIndex + 1 } : null
  }

  extractRulesFromSection(lines, startIndex) {
    const rules = []
    
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Stop at next section
      if (line.startsWith('#') && !line.startsWith('###')) {
        break
      }
      
      // Extract bullet points and numbered items
      if (line.match(/^[-*]\s+/) || line.match(/^\d+\.\s+/)) {
        const rule = line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '')
        if (rule.includes('CRITICAL') || rule.includes('✅') || rule.includes('❌')) {
          rules.push({
            rule: rule,
            type: rule.includes('CRITICAL') ? 'CRITICAL' : 'RULE',
            line: i + 1
          })
        }
      }
    }
    
    return rules
  }

  formatRules() {
    const criticalRules = this.rules.filter(r => r.type === 'CRITICAL' || r.type === 'CHECKLIST_CRITICAL')
    const otherRules = this.rules.filter(r => r.type !== 'CRITICAL' && r.type !== 'CHECKLIST_CRITICAL')
    
    let output = '# AGENT RULES VALIDATION\n\n'
    
    if (criticalRules.length > 0) {
      output += '## ⚠️ CRITICAL RULES (MUST NEVER BE VIOLATED)\n\n'
      criticalRules.forEach((rule, index) => {
        output += `${index + 1}. **${rule.rule}**\n`
        output += `   - Source: ${rule.file}:${rule.line}\n\n`
      })
    }
    
    if (otherRules.length > 0) {
      output += '## 📋 OTHER IMPORTANT RULES\n\n'
      otherRules.forEach((rule, index) => {
        output += `${index + 1}. ${rule.rule}\n`
        output += `   - Source: ${rule.file}:${rule.line}\n\n`
      })
    }
    
    return output
  }

  getValidationChecklist() {
    const criticalRules = this.rules.filter(r => r.type === 'CRITICAL' || r.type === 'CHECKLIST_CRITICAL')
    
    let checklist = '## VALIDATION CHECKLIST\n\n'
    checklist += 'Before generating or modifying any code, validate against these rules:\n\n'
    
    criticalRules.forEach((rule, index) => {
      checklist += `- [ ] ${rule.rule}\n`
    })
    
    return checklist
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const agentDir = process.argv[2] || './agent'
  
  try {
    const extractor = new AgentRuleExtractor(agentDir)
    const rules = extractor.extractRules()
    
    console.log(`Found ${rules.length} rules from agent directory`)
    console.log('\n' + extractor.formatRules())
    console.log('\n' + extractor.getValidationChecklist())
    
  } catch (error) {
    console.error('Error extracting agent rules:', error.message)
    process.exit(1)
  }
}

export { AgentRuleExtractor }