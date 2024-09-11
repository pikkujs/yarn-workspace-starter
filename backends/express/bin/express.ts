#!/usr/bin/env node
import { Command } from 'commander'
import { start } from './express-start'

const program = new Command('bookbliss')
program.usage('[command]')

start(program)

program.parse(process.argv)