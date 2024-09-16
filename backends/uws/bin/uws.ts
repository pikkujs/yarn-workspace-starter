#!/usr/bin/env node
import { Command } from 'commander'
import { start } from './uws-start'

const program = new Command('uws')
program.usage('[command]')

start(program)

program.parse(process.argv)