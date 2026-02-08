## Authentication & Authorization

As a Fleet Manager, I want to log in securely using email and password with 2FA, so that I can access my fleet data safely and ensure unauthorized users cannot gain access.

As an Admin, I want to assign roles and permissions to new users, so that team members can only access features relevant to their responsibilities, preventing security breaches.

As a Mechanic, I want to reset my password via email verification, so that I can regain access without relying on admin intervention.

## Vehicle Management

As a Fleet Manager, I want to add new vehicles with metadata such as VIN, model, year, mileage, and fleet assignment, so that all fleet vehicles are tracked accurately in the system.

As a Fleet Manager, I want to update vehicle information including status, mileage, and sensor calibration data, so that maintenance schedules and AI predictions are accurate.

As a Fleet Manager, I want to remove vehicles that are decommissioned or sold, so that dashboard analytics reflect only active vehicles.

## Telementry Ingestion

As a Fleet Manager, I want the system to ingest real-time sensor data (engine temp, battery voltage, RPM, speed, fuel level) via REST or WebSockets, so that I can monitor vehicle health continuously and detect anomalies immediately.

As a Mechanic, I want the system to validate and flag inconsistent telemetry data, so that false alerts are minimized and predictive insights remain reliable.

As a Fleet Manager, I want the system to store timestamped telemetry history per vehicle, so that long-term trends and predictive models can be generated accurately.

## Fleet dashboard

As a Fleet Manager, I want to see a real-time summary of fleet health with visual indicators for risk levels, alerts, and critical metrics, so that I can make quick decisions on maintenance priorities.

As a Fleet Manager, I want to filter and sort vehicles by fleet, risk score, or operational status, so that I can focus on the most urgent maintenance tasks.

As a Operations Manager, I want to see aggregated metrics such as average uptime, maintenance frequency, and cost per vehicle, so that I can evaluate fleet efficiency and ROI.

## Predictive analysis and alert

As a Fleet Manager, I want the system to calculate predictive risk scores for each vehicle based on telemetry data and historical maintenance, so that I can proactively schedule repairs before breakdowns occur.

As a Fleet Manager, I want automated alerts for vehicles exceeding risk thresholds with severity levels (low, medium, high), so that I can prioritize urgent interventions efficiently.

As a Mechanic, I want to view alert details including sensor readings, risk score, and suggested maintenance actions, so that I understand the exact reason for predicted failures.

## Maintenance management

As a Fleet Manager, I want to log and track maintenance tasks per vehicle with timestamps and mechanic details, so that historical repair data is always accessible for analysis and audits.

As a Mechanic, I want to mark maintenance tasks as completed and optionally attach notes or images, so that fleet records remain accurate and actionable.

As a Fleet Manager, I want the system to generate recommended maintenance actions automatically based on AI insights, so that scheduling is optimized and vehicle downtime minimized.

## AI Assistant

As a Fleet Manager, I want to ask the AI assistant natural language questions about vehicle health, such as “Which vehicles are at highest risk this week?”, so that I can quickly identify priorities without manually analyzing raw data.

As a Fleet Manager, I want to ask the AI assistant to summarize fleet health trends over the last month, so that I can present actionable insights to stakeholders.

As a Fleet Manager, I want to ask the AI assistant for recommended maintenance schedules based on predictive risk scores, so that my team can plan interventions efficiently.

As a Mechanic, I want the AI assistant to explain risk scores and failure predictions in plain language with context from telemetry data, so that I understand the rationale behind recommendations and can verify them.
