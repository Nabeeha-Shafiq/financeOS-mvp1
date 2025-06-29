FinanceOS Lite: AI-Powered Expense Management
FinanceOS Lite is a modern, web-based financial management application designed to simplify expense tracking for individuals and small businesses in Pakistan. It leverages the power of Generative AI to automate data extraction from receipts and bank statements, providing users with a comprehensive suite of tools for analytics and reporting.

Core Features
1. Unified Data Entry
A consolidated, tab-based interface for all data input methods:

Receipt Scanner: Upload JPG, PNG, PDF, or HEIC files via drag-and-drop or camera capture. The system supports bulk uploads and ZIP archives, automatically unpacking and processing files.
AI-Powered OCR: Utilizes Google's Gemini Pro model to intelligently scan receipts, extract key information (merchant, amount, date, items), and suggest an appropriate expense category.
Bank Statement Import: Process bank statements from major Pakistani banks (in PDF, CSV, Excel, or HTML format). The AI extracts transactions and attempts to auto-match them with uploaded receipts.
Manual Entry: A quick-entry form for logging expenses without a digital receipt, like cash payments.
2. Executive Dashboard
An interactive, KPI-driven dashboard serves as the central hub, providing at-a-glance financial insights:

Key Metrics: Summary cards for Total Income, Total Expenses, Personal vs. Business spending, and potential Tax Savings.
Visual Analytics: Interactive charts powered by Recharts, including:
Expense Timeline (Line Chart): Tracks spending over time.
Category Breakdown (Pie Chart): Visualizes spending proportions.
Spending Trends (Bar Chart): Compares spending across categories.
Advanced Filtering: Drill down into data with powerful filters for date range, amount, and category.
Recent Activity: A detailed log of all expenses for easy review.
3. Comprehensive Reporting Suite
A dedicated "Reports" section for deep financial analysis:

Profit & Loss Statement: A Pakistani-format P&L report showing income, categorized expenses, and net profit/loss.
Cash Flow Analysis: Visualizes monthly cash inflows vs. outflows.
Expense Summary: A detailed breakdown of spending by category, highlighting tax-deductible items.
Vendor Analysis: Ranks top vendors by spending amount and frequency.
FBR Compliance Report: Generates a summary to aid in tax filing, including checklists for required documentation.
4. Export & Compliance
Multi-Format Export: Export reports, including the FBR compliance summary, to PDF or CSV.
Pakistani Localization: All financial data is handled in PKR, with formats and categories tailored for the local context.
Technical Architecture & Tech Stack
This project is built on a modern, server-rendered web stack designed for performance, type safety, and a great developer experience.

Framework: Next.js 15 (with App Router) for its hybrid server-side and client-side rendering capabilities.
Language: TypeScript for robust type safety and improved code quality.
UI Library: React 18 for building interactive user interfaces.
Component Library: ShadCN UI provides a set of beautifully designed, accessible, and customizable components.
Styling: Tailwind CSS for a utility-first CSS framework that enables rapid UI development.
Generative AI: Google's Gemini Pro model is leveraged via Genkit, a TypeScript-native framework for building production-ready AI flows.
extractReceiptData: A Genkit flow that uses multi-modal capabilities to read receipt images/PDFs.
extractBankStatementData: A Genkit flow optimized to parse various Pakistani bank statement formats and intelligently categorize transactions.
State Management: React Context API (FinancialDataProvider) is used for managing the application's global state (files, transactions) in a clean, centralized manner.
Forms: React Hook Form combined with Zod for powerful, type-safe form validation.
Charting: Recharts for creating interactive and responsive data visualizations.
File Handling & Export:
Client-Side Libraries: jszip for handling ZIP archives, heic2any for HEIC-to-JPEG conversion, and browser-image-compression for optimizing uploads.
Exporting: jspdf and jspdf-autotable for generating PDF documents on the client side.
Getting Started
To run this project locally, you'll need to set up your environment and install the required dependencies.

Prerequisites
Node.js (v18 or later)
npm or yarn
1. Install dependencies
npm install
2. Set up Environment Variables
The application uses Google's Gemini model for its AI features. You will need a Google AI API key.

Create a .env file in the root of the project by copying the example file:
cp .env.example .env
Open the .env file and add your Google AI API Key:
GOOGLE_API_KEY="your_api_key_here"
3. Run the Development Server
npm run dev
The application will be available at http://localhost:9002.
