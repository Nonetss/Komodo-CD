import { describe, expect, test } from "bun:test"

import {
  classifyTrivyError,
  parseTrivyReport,
  trivyErrorMessage,
} from "#lib/trivy"
import {
  notFoundStderr,
  trivyReportJson,
  unauthorizedStderr,
  unavailableStderr,
} from "#tests/fixtures/trivy"

describe("parseTrivyReport", () => {
  const result = parseTrivyReport(trivyReportJson)

  test("reads the OS and the digest", () => {
    expect(result.os).toBe("alpine 3.19.9")
    expect(result.digest).toStartWith("alpine@sha256:")
  })

  test("drops repeated entries and counts by severity", () => {
    expect(result.vulnerabilities).toHaveLength(5)
    expect(result.counts).toEqual({
      critical: 1,
      high: 1,
      medium: 1,
      low: 1,
      unknown: 1,
    })
  })

  test("sorts by severity, then by id", () => {
    expect(result.vulnerabilities.map((v) => v.severity)).toEqual([
      "CRITICAL",
      "HIGH",
      "MEDIUM",
      "LOW",
      "UNKNOWN",
    ])
  })

  test("counts the ones with a fixed version", () => {
    const critical = result.vulnerabilities[0]
    expect(critical).toMatchObject({
      id: "CVE-2026-1111",
      pkg: "left-pad",
      fixed: null,
      target: "app/package-lock.json",
    })
    expect(result.fixable).toBe(4)
  })

  test("reads an unknown severity as UNKNOWN", () => {
    const report = JSON.parse(trivyReportJson)
    report.Results[0].Vulnerabilities[0].Severity = "NEGLIGIBLE"
    const parsed = parseTrivyReport(JSON.stringify(report))
    expect(parsed.counts).toMatchObject({ medium: 0, unknown: 2 })
  })

  test("an image without results gives zeros", () => {
    const parsed = parseTrivyReport(JSON.stringify({ SchemaVersion: 2 }))
    expect(parsed).toEqual({
      os: null,
      digest: null,
      counts: { critical: 0, high: 0, medium: 0, low: 0, unknown: 0 },
      fixable: 0,
      vulnerabilities: [],
    })
  })
})

describe("classifyTrivyError", () => {
  test("registry without access", () => {
    expect(classifyTrivyError(unauthorizedStderr)).toBe("unauthorized")
  })

  test("missing image or tag", () => {
    expect(classifyTrivyError(notFoundStderr)).toBe("not-found")
  })

  test("server or binary unavailable", () => {
    expect(classifyTrivyError(unavailableStderr)).toBe("unavailable")
    expect(classifyTrivyError('Executable not found in $PATH: "trivy"')).toBe(
      "unavailable"
    )
  })

  test("anything else", () => {
    expect(classifyTrivyError("unexpected EOF")).toBe("other")
  })
})

describe("trivyErrorMessage", () => {
  test("keeps the last line, without the bullet", () => {
    expect(trivyErrorMessage(unauthorizedStderr)).toStartWith(
      "remote error: GET https://ghcr.io/token"
    )
  })

  test("strips Trivy's log prefix", () => {
    expect(trivyErrorMessage(unavailableStderr)).toStartWith("run error:")
  })

  test("caps it at 500 characters", () => {
    expect(trivyErrorMessage("x".repeat(800))).toHaveLength(500)
  })

  test("without error output", () => {
    expect(trivyErrorMessage("\n\n")).toBe("Trivy terminó sin dar motivo")
  })
})
