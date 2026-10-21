#!/usr/bin/env python3
"""Write the Secure By Design control-family practice plans (owner direction, 20 October 2026).

One original plan per NIST SP 800-53 Rev. 5 control family except configuration management, which already has
its own practice plan (SBD-Training-CM-Plan.docx). Each plan follows that plan's design exactly (it is the style
template: cover lines, the training-sample header and footer, navy table headers, green worked-example rows and
red bracketed fields) and is written from public sources only: the JSIG (11 April 2016), NIST SP 800-53 Rev. 5
Release 5.2.0 with the SP 800-53B baselines (content/authorization/control-index.json), and the NIST guide named
for the family. No wording comes from any third party's templates.

    python3 scripts/prepare-family-plans.py        # writes public/training/library/training-samples/SBD-Training-<XX>-Plan.docx

The catalog entries are in content/ato-templates.json (samples).
"""
import copy, json, re
from pathlib import Path
import docx
from docx.oxml.ns import qn

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / 'public/training/library/training-samples/SBD-Training-CM-Plan.docx'
OUT = ROOT / 'public/training/library/training-samples'
INDEX = json.loads((ROOT / 'content/authorization/control-index.json').read_text())

JSIG = 'DoD Joint SAP Implementation Guide (JSIG), 11 April 2016: the {code} family (public on dcsa.mil).'
R5 = 'NIST SP 800-53 Rev. 5, Release 5.2.0, the {code} family.'
R5B = 'NIST SP 800-53B, Control Baselines for Information Systems and Organizations.'
CNSSI = 'CNSSI 1253, Categorization and Control Selection for National Security Systems.'

ROLES = {
    'ISO': 'Information System Owner (ISO)', 'ISSM': 'Information System Security Manager (ISSM)',
    'ISSO': 'Information System Security Officer (ISSO)', 'AO': 'Authorizing Official (AO)',
    'SCA': 'Security Control Assessor (SCA)', 'SA': 'System administrators', 'PSO': 'Program Security Officer (PSO)',
}

# Each family: plan title, the control that requires the plan, purpose, roles, two family sections, guide sources,
# and its catalog entry (RMF step group, tasks, tag, note).
FAMILIES = {
 'AC': dict(title='Access Control Plan', ref='AC-1', group='implement', rmf='S-4, I-1, I-2', tag='AC plan',
   purpose='how accounts are requested, approved, created, reviewed and removed, how privileges are limited to what each role needs, and how sessions and remote access are controlled',
   roles=[('ISO', 'Owns the access control policy for the system and approves the account types it allows.'), ('ISSM', 'Approves privileged accounts and exceptions, and reviews account audits (AC-2 j).'), ('ISSO', 'Runs the account reviews and checks that removals happen on time.'), ('SA', 'Create, change and disable accounts only on an approved request, from the administration seats.')],
   sections=[('Account management (AC-2)', 'List every account type the system allows and how each is managed.', ['Account type', 'Approved by', 'Created and removed', 'Review', 'Notes'],
       ['Tier 0 administrator (SBD Tier 0 Admins)', 'ISSM', 'On a ticket, by a second Tier 0 administrator; disabled the same day on departure', 'Monthly', 'Signs in only at AdminJumpBox01 (AC-6)'],
       [['Standard user', '[role]', '[process]', '[frequency]', '[notes]'], ['Service account', '[role]', '[process]', '[frequency]', '[notes]']]),
     ('Least privilege and sessions (AC-6, AC-7, AC-11, AC-12, AC-17)', 'Record each setting and where it is enforced, so the assessor can test it.', ['Control', 'Setting for this system', 'Enforced by'],
       ['AC-7 Unsuccessful logon attempts', 'Three failed attempts lock the account until an administrator unlocks it', 'Domain password and lockout policy; checked by the STIG scan'],
       [['AC-11 Device lock', '[setting]', '[where]'], ['AC-12 Session termination', '[setting]', '[where]'], ['AC-17 Remote access', '[setting, or Not permitted]', '[where]']])],
   sources=['NIST SP 800-46 Rev. 2, Guide to Enterprise Telework, Remote Access, and Bring Your Own Device (BYOD) Security.'],
   note='Roles, account types with a worked Tier 0 example, least-privilege and session settings, every AC control with its baseline, and plan approval.'),
 'AT': dict(title='Awareness and Training Plan', ref='AT-1', group='implement', rmf='S-4, I-1, I-2', tag='AT plan',
   purpose='which security and privacy training each audience receives, when they receive it, and how completion is recorded',
   roles=[('ISSM', 'Sets the training each role needs and approves the course list.'), ('ISSO', 'Tracks completion and blocks access when required training lapses.'), ('ISO', 'Makes sure users and administrators have time to complete training.'), ('PSO', 'Sets any program-specific briefings required before SAP access.')],
   sections=[('Training by audience (AT-2, AT-3)', 'List each audience and the training it must complete.', ['Audience', 'Training or briefing', 'When', 'Frequency', 'Recorded in'],
       ['All users', 'Cybersecurity awareness, including insider threat', 'Before an account is issued', 'Annually', 'Training tracker on SBD-FS01'],
       [['Privileged users', '[course]', '[when]', '[frequency]', '[record]'], ['[role]', '[course]', '[when]', '[frequency]', '[record]']]),
     ('Training records (AT-4)', 'Keep a record for each person, and keep it for the period the AO sets.', ['Name', 'Training', 'Completed', 'Next due', 'Verified by'],
       ['J. Rivera (fictional)', 'Cybersecurity awareness', '2026-10-02', '2027-10-02', 'ISSO'],
       [['[name]', '[training]', '[date]', '[date]', '[role]'], ['[name]', '[training]', '[date]', '[date]', '[role]']])],
   sources=['NIST SP 800-50 Rev. 1, Building a Cybersecurity and Privacy Learning Program.'],
   note='Roles, training by audience with a worked all-users row, training records, every AT control with its baseline, and plan approval.'),
 'AU': dict(title='Audit and Accountability Plan', ref='AU-1', group='implement', rmf='S-4, I-1, I-2', tag='AU plan',
   purpose='which events the system records, what each record contains, where records go, who reviews them, and how records are protected and kept',
   roles=[('ISSM', 'Approves the event list, the retention period and the review schedule.'), ('ISSO', 'Reviews audit records, reports findings and keeps the review log.'), ('SA', 'Configure logging and forwarding on every component, and report gaps.'), ('AO', 'Sets the retention period when the system holds records under other requirements.')],
   sections=[('Events the system records (AU-2, AU-3)', 'List each event, where it comes from and where it is sent.', ['Event', 'Source', 'Record content', 'Sent to'],
       ['Successful and failed sign-ins', 'Domain controllers (Security log)', 'Date, time, user, source host and outcome', 'SBD-SYSLOG01, then SBD-AUDIT01'],
       [['[event]', '[source]', '[content]', '[destination]'], ['[event]', '[source]', '[content]', '[destination]']]),
     ('Review, retention and protection (AU-6, AU-9, AU-11)', 'Say who reviews what, how often, and how records are protected from change.', ['Activity', 'Who', 'How often', 'Tool or method'],
       ['Review privileged sign-ins', 'ISSO', 'Weekly', 'Saved search on SBD-SPLUNK01'],
       [['Keep audit records', '[role]', '[retention period set by the AO]', '[where]'], ['Protect audit records', '[role]', '[frequency]', '[method]']])],
   sources=['NIST SP 800-92, Guide to Computer Security Log Management.'],
   note='Roles, the event list with a worked sign-in example, review, retention and protection, every AU control with its baseline, and plan approval.'),
 'CA': dict(title='Assessment, Authorization and Monitoring Plan', ref='CA-1', group='assess', rmf='A-1, A-2, A-3, A-6, M-2', tag='CA plan',
   purpose='how the controls are assessed, how interconnections are approved, how weaknesses are tracked in the POA&M, and how the authorization is kept current',
   roles=[('AO', 'Decides whether to authorize the system and accepts the residual risk.'), ('SCA', 'Plans and performs the control assessment and writes the assessment report.'), ('ISSM', 'Prepares the package, owns the POA&M and coordinates continuous monitoring.'), ('ISO', 'Fixes weaknesses on schedule and funds the work.')],
   sections=[('Assessments (CA-2)', 'List each assessment, who performs it and where results are recorded.', ['Assessment', 'Assessor', 'Scope', 'Schedule', 'Results in'],
       ['Initial control assessment', 'Independent SCA', 'All selected controls', 'Before the authorization decision', 'SAR and SCTM'],
       [['[assessment]', '[assessor]', '[scope]', '[schedule]', '[record]'], ['Annual assessment', '[assessor]', '[subset of controls]', '[schedule]', '[record]']]),
     ('Interconnections and the POA&M (CA-3, CA-5)', 'Record the decisions the AO needs to see.', ['Item', 'Decision for this system'],
       ['Interconnections', 'None. The enclave is air-gapped; transfers follow the media protection plan'],
       [['POA&M owner', '[role]'], ['POA&M review frequency', '[frequency]'], ['Authorization termination date', '[date set by the AO]']])],
   sources=['NIST SP 800-37 Rev. 2, Risk Management Framework for Information Systems and Organizations.', 'NIST SP 800-53A Rev. 5, Assessing Security and Privacy Controls in Information Systems and Organizations.'],
   note='Roles, the assessment schedule with a worked initial assessment, interconnection and POA&M decisions, every CA control with its baseline, and plan approval.'),
 'CP': dict(title='Contingency Plan', ref='CP-2', group='implement', rmf='S-4, I-1, I-2', tag='Contingency plan',
   purpose='which services matter most, how quickly each must be restored, how data is backed up, and how the plan is tested and kept current',
   roles=[('ISO', 'Owns the contingency plan and decides the recovery priorities with mission owners.'), ('ISSM', 'Approves the plan and makes sure recovery keeps the system secure.'), ('SA', 'Run backups, perform restores and keep recovery procedures current.'), ('ISSO', 'Checks that tests happen and records the results.')],
   sections=[('Recovery objectives and priorities (CP-2)', 'List each system or service with its recovery time objective (RTO) and recovery point objective (RPO).', ['System or service', 'Mission impact if lost', 'RTO', 'RPO', 'Priority'],
       ['SBD-DC01 and SBD-DC02 (directory and DNS)', 'No one can sign in or resolve names', '4 hours', '24 hours', '1'],
       [['[system]', '[impact]', '[time]', '[time]', '[priority]'], ['[system]', '[impact]', '[time]', '[time]', '[priority]']]),
     ('Backups and testing (CP-4, CP-9, CP-10)', 'Record each backup and how the restore is proven.', ['What is backed up', 'Method', 'Frequency', 'Stored at', 'Restore tested'],
       ['Directory system state', 'Windows Server Backup to the offline vault', 'Daily', 'Offline backup vault', 'Quarterly'],
       [['[data or system]', '[method]', '[frequency]', '[location]', '[frequency]'], ['[data or system]', '[method]', '[frequency]', '[location]', '[frequency]']])],
   sources=['NIST SP 800-34 Rev. 1, Contingency Planning Guide for Federal Information Systems.'],
   note='Roles, recovery objectives with a worked directory example, backups and restore testing, every CP control with its baseline, and plan approval.'),
 'IA': dict(title='Identification and Authentication Plan', ref='IA-1', group='implement', rmf='S-4, I-1, I-2', tag='IA plan',
   purpose='how users, devices and services are identified, which authenticators they use, and how authenticators are issued, protected and revoked',
   roles=[('ISSM', 'Approves the authenticator types and any exception to them.'), ('ISSO', 'Checks issuance and revocation records against the account list.'), ('SA', 'Issue and reset authenticators only after verifying identity.'), ('ISO', 'Makes sure the system supports the required authenticators.')],
   sections=[('Identifiers and authenticators (IA-2, IA-4, IA-5)', 'List each account type with its identifier and authenticator.', ['Account type', 'Identifier', 'Authenticator', 'Issued by', 'Revoked when'],
       ['Privileged user', 'adm-<initials> in SBD Tier 0 Admins', 'Password set by the domain policy [plus second factor if required]', 'Tier 0 administrator', 'The person leaves or changes role'],
       [['Standard user', '[format]', '[authenticator]', '[role]', '[event]'], ['Service account', '[format]', '[authenticator]', '[role]', '[event]']]),
     ('Devices and services (IA-3, IA-9)', 'Record how components prove who they are to each other.', ['Item', 'How it authenticates', 'Notes'],
       ['Domain-joined servers', 'Kerberos, with computer accounts in sbd.test', 'Certificates from SBD-SUBCA01 for TLS'],
       [['[device or service]', '[method]', '[notes]'], ['[device or service]', '[method]', '[notes]']])],
   sources=['NIST SP 800-63-4, Digital Identity Guidelines.'],
   note='Roles, identifiers and authenticators with a worked privileged-user row, device and service authentication, every IA control with its baseline, and plan approval.'),
 'IR': dict(title='Incident Response Plan', ref='IR-8', group='implement', rmf='S-4, I-1, I-2', tag='IR plan',
   purpose='how incidents are detected, reported, contained and resolved, who must be told and how fast, and how the plan is tested and improved',
   roles=[('ISSM', 'Leads the response, reports to the PSO and AO, and approves the plan.'), ('ISSO', 'Receives reports, starts the response and keeps the incident record.'), ('PSO', 'Directs reporting and handling for SAP information, including spillage.'), ('SA', 'Preserve evidence and carry out containment and recovery steps as directed.')],
   sections=[('Incident categories and reporting (IR-6)', 'List each category, who is told, and the deadline.', ['Category', 'Example', 'Report to', 'Within'],
       ['Suspected spillage', 'Classified data found on a system not approved for it', 'ISSM, then the PSO', '[time set by the PSO]'],
       [['[category]', '[example]', '[recipient]', '[time]'], ['[category]', '[example]', '[recipient]', '[time]']]),
     ('Response steps and testing (IR-3, IR-4)', 'Record the steps the team follows and how the plan is exercised.', ['Step', 'What happens', 'Owner'],
       ['Contain', 'Isolate the affected component without powering it off, and preserve its logs', 'ISSO with system administrators'],
       [['Detect and report', '[actions]', '[role]'], ['Eradicate and recover', '[actions]', '[role]'], ['Review lessons learned', '[actions and plan updates]', '[role]'], ['Test the plan', '[exercise type and frequency]', '[role]']])],
   sources=['NIST SP 800-61 Rev. 3, Incident Response Recommendations and Considerations for Cybersecurity Risk Management.'],
   note='Roles, incident categories and reporting with a worked spillage example, response steps and testing, every IR control with its baseline, and plan approval.'),
 'MA': dict(title='Maintenance Plan', ref='MA-1', group='implement', rmf='S-4, I-1, I-2', tag='MA plan',
   purpose='how components are maintained, which tools and people may do the work, and how maintenance is recorded',
   roles=[('ISO', 'Schedules maintenance and funds support contracts.'), ('ISSM', 'Approves maintenance tools and maintenance personnel without access.'), ('SA', 'Perform maintenance on schedule and record each action.'), ('ISSO', 'Checks maintenance records against change requests.')],
   sections=[('Maintenance schedule (MA-2, MA-6)', 'List each recurring maintenance task.', ['Component', 'Task', 'Frequency', 'Performed by', 'Recorded in'],
       ['Hypervisor hosts', 'Firmware updates from the approved repository', 'Quarterly', 'SBD IT Operations', 'Maintenance log and change request'],
       [['[component]', '[task]', '[frequency]', '[role]', '[record]'], ['[component]', '[task]', '[frequency]', '[role]', '[record]']]),
     ('Tools and personnel (MA-3, MA-4, MA-5)', 'Record the rule for each.', ['Item', 'Rule for this system'],
       ['Nonlocal maintenance', 'Not permitted: the enclave is air-gapped'],
       [['Maintenance tools', '[how tools are approved and inspected before use]'], ['Maintenance personnel without access', '[escort and supervision rule]']])],
   sources=[],
   note='Roles, the maintenance schedule with a worked host example, tool and personnel rules, every MA control with its baseline, and plan approval.'),
 'MP': dict(title='Media Protection Plan', ref='MP-1', group='implement', rmf='S-4, I-1, I-2', tag='MP plan',
   purpose='how digital and paper media are marked, stored, transported, sanitized and destroyed',
   roles=[('ISSM', 'Approves media types, transfer procedures and sanitization methods.'), ('ISSO', 'Keeps the media inventory and the destruction log.'), ('PSO', 'Sets marking and handling rules for SAP information.'), ('SA', 'Use only approved media and follow the transfer procedure.')],
   sections=[('Media handling (MP-2, MP-3, MP-4, MP-5)', 'List each media type and how it is handled.', ['Media type', 'Marking', 'Storage', 'Transport', 'Approved by'],
       ['Removable media for software transfers', 'Classification label and control number', 'Approved container in the media room', 'Hand-carried by an authorized courier', 'ISSM'],
       [['[media type]', '[marking]', '[storage]', '[transport]', '[role]'], ['[media type]', '[marking]', '[storage]', '[transport]', '[role]']]),
     ('Sanitization and destruction (MP-6)', 'Record how each media type is sanitized or destroyed, and how that is proven.', ['Media', 'Method', 'Verified by', 'Record'],
       ['Hard drive from a retired workstation', 'Destroyed with an NSA-evaluated device', 'A second person', 'Destruction log'],
       [['[media]', '[method]', '[role]', '[record]'], ['[media]', '[method]', '[role]', '[record]']])],
   sources=['NIST SP 800-88, Guidelines for Media Sanitization.'],
   note='Roles, media handling with a worked transfer-media row, sanitization and destruction, every MP control with its baseline, and plan approval.'),
 'PE': dict(title='Physical and Environmental Protection Plan', ref='PE-1', group='implement', rmf='S-4, I-1, I-2', tag='PE plan',
   purpose='who may enter each area, how entry is controlled and recorded, how visitors are handled, and how power, fire, temperature and water are managed',
   roles=[('ISSM', 'Approves the access lists and checks that physical controls match the system design.'), ('PSO', 'Sets the physical requirements for the SAP facility.'), ('ISO', 'Funds and maintains the facility protections the system relies on.'), ('ISSO', 'Reviews access records and visitor logs.')],
   sections=[('Physical access (PE-2, PE-3, PE-8)', 'List each area and how access to it is controlled.', ['Area', 'Who may enter', 'Access control', 'Visitors', 'Records'],
       ['Server room', 'Administrators on the access list', 'Badge reader and cipher lock', 'Escorted at all times', 'Access list reviewed monthly; visitor log kept'],
       [['Administration room', '[who]', '[control]', '[rule]', '[record]'], ['Media room', '[who]', '[control]', '[rule]', '[record]']]),
     ('Environmental protection (PE-9 to PE-15)', 'Record the protection, the equipment and how often it is checked.', ['Protection', 'Equipment', 'Checked'],
       ['Emergency power (PE-11)', 'Uninterruptible power supply for the server room racks', 'Monthly'],
       [['Fire protection (PE-13)', '[equipment]', '[frequency]'], ['Temperature and humidity (PE-14)', '[equipment]', '[frequency]'], ['Water damage (PE-15)', '[equipment]', '[frequency]']])],
   sources=[],
   note='Roles, physical access by area with a worked server-room row, environmental protections, every PE control with its baseline, and plan approval.'),
 'PL': dict(title='Security and Privacy Planning', ref='PL-2', group='select', rmf='S-4, I-2', tag='PL plan',
   purpose='which plans the system keeps, who owns each, the rules of behavior users accept, and how plans are kept current',
   roles=[('ISSM', 'Owns the System Security Plan and keeps it current.'), ('ISO', 'Approves the plans for the system and the rules of behavior.'), ('AO', 'Reviews the plans as part of the authorization package.'), ('ISSO', 'Collects signed rules of behavior before access is granted.')],
   sections=[('Plans and documents (PL-2)', 'List each plan the package relies on.', ['Document', 'Owner', 'Kept at', 'Reviewed'],
       ['System Security Plan', 'ISSM', 'Package library on SBD-FS01', 'Annually and after a significant change'],
       [['[plan]', '[role]', '[location]', '[frequency]'], ['[plan]', '[role]', '[location]', '[frequency]']]),
     ('Rules of behavior (PL-4)', 'Every user reads and signs the rules before access, and again when they change.', ['Name', 'Role', 'Version signed', 'Date'],
       ['J. Rivera (fictional)', 'Standard user', '1.0', '2026-10-02'],
       [['[name]', '[role]', '[version]', '[date]'], ['[name]', '[role]', '[version]', '[date]']])],
   sources=['NIST SP 800-18 Rev. 1, Guide for Developing Security Plans for Federal Information Systems.'],
   note='Roles, the plans the package relies on with a worked SSP row, signed rules of behavior, every PL control with its baseline, and plan approval.'),
 'PM': dict(title='Program Management Plan', ref='PM-1', group='prepare', rmf='P-1, P-2, P-3', tag='PM plan',
   purpose='how the organization runs its security and privacy program: who leads it, how it is resourced, how risk is managed across systems, and how progress is measured',
   roles=[('AO', 'Accepts risk for the systems in the program and reviews program measures.'), ('ISSM', 'Reports system status and needs into the program.'), ('ISO', 'Plans resources for the system within the program.'), ('PSO', 'Sets program security requirements for SAP systems.')],
   sections=[('Program roles and resources (PM-2, PM-3, PM-9)', 'Record the organization-level decisions every system plan relies on.', ['Item', 'Decision for the organization'],
       ['Senior information security officer', 'Director of Security, Secure By Design (fictional)'],
       [['Resources for the program', '[budget and staffing decision]'], ['Risk management strategy (PM-9)', '[where the strategy is kept and who approves it]']]),
     ('Program measures (PM-6, PM-14)', 'List the measures the program reports.', ['Measure', 'Target', 'Reported to', 'Frequency'],
       ['Systems with a current authorization', '100%', 'Authorizing Official', 'Quarterly'],
       [['[measure]', '[target]', '[recipient]', '[frequency]'], ['Testing, training and monitoring done on schedule (PM-14)', '[target]', '[recipient]', '[frequency]']])],
   sources=['NIST SP 800-39, Managing Information Security Risk: Organization, Mission, and Information System View.'],
   note='Organization-level roles and resources with a worked example, program measures, every PM control (SP 800-53B assigns them to the organization, not a baseline), and plan approval.'),
 'PS': dict(title='Personnel Security Plan', ref='PS-1', group='implement', rmf='S-4, I-1, I-2', tag='PS plan',
   purpose='how positions are designated, how people are screened before access, and what happens when they transfer or leave',
   roles=[('PSO', 'Sets the screening and access requirements for SAP positions.'), ('ISSM', 'Confirms screening before accounts are approved.'), ('ISO', 'Designates the risk of each position on the system.'), ('ISSO', 'Disables access when a transfer or termination is reported.')],
   sections=[('Position risk and screening (PS-2, PS-3)', 'List each position and its screening.', ['Position', 'Risk designation', 'Screening before access', 'Rescreening'],
       ['Tier 0 system administrator', 'Critical-sensitive', 'Clearance and SAP access as directed by the PSO', '[frequency]'],
       [['[position]', '[designation]', '[screening]', '[frequency]'], ['[position]', '[designation]', '[screening]', '[frequency]']]),
     ('Transfers, terminations and agreements (PS-4, PS-5, PS-6)', 'Record what happens, how fast, and who does it.', ['Event', 'Actions', 'Within', 'Owner'],
       ['Termination', 'Disable accounts, collect badges and authenticators, and debrief', 'Same day', 'ISSM and security officer'],
       [['Transfer', '[actions]', '[time]', '[role]'], ['Access agreement (PS-6)', '[agreement signed before access]', '[when]', '[role]']])],
   sources=[],
   note='Roles, position risk and screening with a worked administrator row, transfers and terminations, every PS control with its baseline, and plan approval.'),
 'PT': dict(title='PII Processing and Transparency Plan', ref='PT-1', group='implement', rmf='S-4, I-1, I-2', tag='PT plan',
   purpose='which personally identifiable information (PII) the system processes, the authority and purpose for each, and the notices and consent that apply',
   roles=[('ISO', 'Owns the PII inventory and the purpose for each element.'), ('ISSM', 'Makes sure PII is protected as the plans require.'), ('AO', 'Accepts privacy risk with the privacy official.'), ('ISSO', 'Checks that PII is processed only for its stated purpose.')],
   sections=[('PII inventory and authority (PT-2, PT-3)', 'List each PII element, why it is processed and where it is kept.', ['PII element', 'Purpose', 'Authority', 'Stored on', 'Shared with'],
       ['Employee name and work phone', 'Account management', '[authority]', 'SBD-DC01 and SBD-DC02 (sbd.test)', 'No one outside the enclave'],
       [['[element]', '[purpose]', '[authority]', '[system]', '[recipients]'], ['[element]', '[purpose]', '[authority]', '[system]', '[recipients]']]),
     ('Notice and consent (PT-4, PT-5, PT-6)', 'Record the decision for each.', ['Item', 'Decision for this system'],
       ['Privacy notice', 'Shown at sign-in with the system use notification'],
       [['Consent', '[decision]'], ['System of records notice (PT-6)', '[required or not required, and why]']])],
   sources=['NIST SP 800-122, Guide to Protecting the Confidentiality of Personally Identifiable Information (PII).', 'NIST Privacy Framework, Version 1.0.'],
   note='Roles, the PII inventory with a worked directory row, notice and consent, every PT control with a pointer to the SP 800-53B privacy baseline, and plan approval.'),
 'RA': dict(title='Risk Assessment Plan', ref='RA-1', group='assess', rmf='P-14, C-2, A-5, M-2', tag='RA plan',
   purpose='how the system is categorized, how risk is assessed and kept current, and how vulnerabilities are found and handled',
   roles=[('ISSM', 'Leads the risk assessment and keeps the risk assessment report (RAR) current.'), ('ISO', 'Provides the mission and data needed to categorize the system.'), ('AO', 'Approves the categorization and accepts residual risk.'), ('ISSO', 'Runs vulnerability scans and tracks the results.')],
   sections=[('Categorization and risk assessment (RA-2, RA-3)', 'Record the decisions the RAR rests on.', ['Item', 'Decision for this system'],
       ['Risk assessment method', 'NIST SP 800-30 Rev. 1, recorded in the RAR'],
       [['Categorization (CNSSI 1253)', '[confidentiality, integrity and availability impact levels]'], ['Risk assessment update frequency', '[frequency, and the events that trigger an update]']]),
     ('Vulnerability monitoring (RA-5)', 'List each scan, its tool and who reviews the results.', ['Scan', 'Tool', 'Frequency', 'Results reviewed by'],
       ['Credentialed vulnerability scan', 'SBD-NESSUS01', 'Weekly', 'ISSO'],
       [['STIG compliance scan', '[tool]', '[frequency]', '[role]'], ['[scan]', '[tool]', '[frequency]', '[role]']])],
   sources=['NIST SP 800-30 Rev. 1, Guide for Conducting Risk Assessments.'],
   note='Roles, categorization and risk assessment decisions, vulnerability monitoring with a worked scan row, every RA control with its baseline, and plan approval.'),
 'SA': dict(title='System and Services Acquisition Plan', ref='SA-1', group='implement', rmf='S-4, I-1, I-2', tag='SA plan',
   purpose='how security requirements are written into purchases, how components are kept supported, and how developers and suppliers document what they deliver',
   roles=[('ISO', 'Includes security requirements in every purchase for the system.'), ('ISSM', 'Reviews purchases for security impact before the CCB approves them.'), ('AO', 'Accepts the risk of any component past its end of support.'), ('SA', 'Report components nearing end of support.')],
   sections=[('Acquisition requirements (SA-4)', 'List what each purchase must include.', ['Item purchased', 'Security requirements stated', 'Documentation required', 'Approved by'],
       ['Windows Server licenses', 'A supported version with security updates for the planned life', "The vendor's security configuration guidance", 'ISSM and the CCB'],
       [['[item]', '[requirements]', '[documentation]', '[role]'], ['[item]', '[requirements]', '[documentation]', '[role]']]),
     ('Supported components (SA-22)', 'Record when each component loses support and what happens then.', ['Component', 'Supported until', 'Plan when support ends'],
       ['Windows Server 2022', "[end-of-support date from the vendor's lifecycle page]", 'Upgrade scheduled through the CM plan'],
       [['[component]', '[date]', '[plan]'], ['[component]', '[date]', '[plan]']])],
   sources=['NIST SP 800-160 Vol. 1 Rev. 1, Engineering Trustworthy Secure Systems.'],
   note='Roles, acquisition requirements with a worked licensing row, supported components, every SA control with its baseline, and plan approval.'),
 'SC': dict(title='System and Communications Protection Plan', ref='SC-1', group='implement', rmf='S-4, I-1, I-2', tag='SC plan',
   purpose='how the system boundary and its segments are protected, which traffic is allowed between them, and how data in transit and keys are protected',
   roles=[('ISSM', 'Approves the boundary design and every permitted path.'), ('SA', 'Configure the router and host firewalls exactly as the ACL register allows.'), ('ISSO', 'Reviews the ACL register against the running configuration.'), ('ISO', 'Owns the system architecture and its boundary.')],
   sections=[('Boundary protection (SC-7)', 'List each permitted path; anything not listed is denied.', ['From and to', 'Permitted traffic', 'Enforced by', 'Reviewed'],
       ['VLAN 80 (office) to VLAN 10 (domain controllers)', 'Kerberos, LDAP, DNS and SMB to SBD-DC01 and SBD-DC02 only', "The core router's ACLs (default deny)", 'With every change, and quarterly'],
       [['[segment] to [segment]', '[traffic]', '[device]', '[frequency]'], ['[segment] to [segment]', '[traffic]', '[device]', '[frequency]']]),
     ('Transmission and cryptography (SC-8, SC-12, SC-13)', 'Record how data in transit is protected and who manages the keys.', ['Use', 'Mechanism', 'Keys managed by'],
       ['TLS for internal web services', 'Certificates from SBD-SUBCA01', 'PKI administrators'],
       [['[use]', '[mechanism]', '[role]'], ['[use]', '[mechanism]', '[role]']])],
   sources=['NIST SP 800-41 Rev. 1, Guidelines on Firewalls and Firewall Policy.', 'NIST SP 800-52 Rev. 2, Guidelines for the Selection, Configuration, and Use of Transport Layer Security (TLS) Implementations.'],
   note='Roles, permitted paths with a worked VLAN example, transmission and key management, every SC control with its baseline, and plan approval.'),
 'SI': dict(title='System and Information Integrity Plan', ref='SI-1', group='implement', rmf='S-4, I-1, I-2', tag='SI plan',
   purpose='how flaws are fixed, how malicious code is prevented, how the system is monitored, and how the integrity of software and information is checked',
   roles=[('ISSM', 'Approves remediation timelines and monitoring requirements.'), ('ISSO', 'Reviews monitoring alerts and tracks remediation.'), ('SA', 'Apply updates and keep protection software current.'), ('ISO', 'Plans downtime for updates.')],
   sections=[('Flaw remediation and malicious code (SI-2, SI-3)', 'Record how each kind of flaw or threat is handled.', ['Item', 'Method', 'Timeline', 'Owner'],
       ['Windows security updates', 'Approved through SBD-WSUS01 in test, then production rings', '[timeline set by the AO]', 'SBD IT Operations'],
       [['Linux security updates', '[method]', '[timeline]', '[role]'], ['Malicious code protection', '[method]', '[update frequency]', '[role]']]),
     ('Monitoring and integrity (SI-4, SI-7)', 'List each monitor, where alerts go and how often they are reviewed.', ['Monitor', 'Tool', 'Alerts go to', 'Reviewed'],
       ['Security event monitoring', 'SBD-SPLUNK01', 'ISSO', 'Daily'],
       [['File and software integrity', '[tool]', '[recipient]', '[frequency]'], ['[monitor]', '[tool]', '[recipient]', '[frequency]']])],
   sources=['NIST SP 800-40 Rev. 4, Guide to Enterprise Patch Management Planning: Preventive Maintenance for Technology.', 'NIST SP 800-83 Rev. 1, Guide to Malware Incident Prevention and Handling for Desktops and Laptops.'],
   note='Roles, flaw remediation and malicious code with a worked update row, monitoring and integrity checks, every SI control with its baseline, and plan approval.'),
 'SR': dict(title='Supply Chain Risk Management Plan', ref='SR-2', group='implement', rmf='S-4, I-1, I-2', tag='SCRM plan',
   purpose='which supply chain risks apply to the system, how suppliers and components are chosen and checked, and how components are disposed of',
   roles=[('ISO', 'Owns supply chain decisions for the system and the plan.'), ('ISSM', 'Assesses supply chain risk before the CCB approves a purchase.'), ('AO', 'Accepts residual supply chain risk.'), ('SA', 'Check components and software on arrival and before use.')],
   sections=[('Supply chain risks and controls (SR-3, SR-5, SR-6)', 'List each supplier or product, the risk considered and the control applied.', ['Supplier or product', 'Risk considered', 'Control applied', 'Approved by'],
       ['Server hardware', 'Tampering in transit', 'Bought from an authorized reseller; seals inspected on arrival', 'ISSM'],
       [['[supplier or product]', '[risk]', '[control]', '[role]'], ['[supplier or product]', '[risk]', '[control]', '[role]']]),
     ('Authenticity and disposal (SR-11, SR-12)', 'Record how each item is checked and how it leaves the system.', ['Item', 'Check', 'Record'],
       ['Software installers', "Hash checked against the publisher's value before the media transfer", 'Media transfer log'],
       [['[item]', '[check]', '[record]'], ['Retired components (SR-12)', '[disposal method]', '[record]']])],
   sources=['NIST SP 800-161 Rev. 1, Cybersecurity Supply Chain Risk Management Practices for Systems and Organizations.'],
   note='Roles, supply chain risks and controls with a worked hardware row, authenticity checks and disposal, every SR control with its baseline, and plan approval.'),
}

W = qn('w:t')
def body_children(doc):
    return [el for el in doc.element.body.iterchildren() if el.tag != qn('w:sectPr')]

def set_runs(par, text, plain_rpr, red_rpr, bold=False):
    """Replace a paragraph's runs: [bracketed] fields red, the rest plain."""
    for r in list(par.findall(qn('w:r'))): par.remove(r)
    for part in re.split(r'(\[[^\]]+\])', text):
        if not part: continue
        r = par.makeelement(qn('w:r'), {})
        rpr = copy.deepcopy(red_rpr if part.startswith('[') and part.endswith(']') else plain_rpr)
        if rpr is not None:
            if bold and rpr.find(qn('w:b')) is None: rpr.insert(0, rpr.makeelement(qn('w:b'), {}))
            r.append(rpr)
        t = r.makeelement(W, {qn('xml:space'): 'preserve'}); t.text = part; r.append(t)
        par.append(r)
    return par

def first_rpr(el, color=None):
    for r in el.iter(qn('w:r')):
        rpr = r.find(qn('w:rPr'))
        c = rpr.find(qn('w:color')) if rpr is not None else None
        val = c.get(qn('w:val')) if c is not None else None
        if (color is None and val in (None, '000000', 'auto', '1F2937', '374151')) or (color and val == color):
            return rpr
    return None

def build(code, spec, template):
    doc = docx.Document(str(TEMPLATE))
    kids = body_children(doc)
    paras = [k for k in kids if k.tag == qn('w:p')]
    tables = [k for k in kids if k.tag == qn('w:tbl')]
    def text(p): return ''.join(t.text or '' for t in p.iter(W))
    cover = paras[:4]
    h1 = next(p for p in paras if 'Purpose and scope' in text(p))
    h2 = next(p for p in paras if text(p).strip() == 'Sources')
    body = paras[paras.index(h1) + 1]
    bullet = next(p for p in paras if text(p).startswith('Each configuration item has a documented baseline'))
    closing = paras[-1]
    plain = first_rpr(body); red = first_rpr(body, '9A3412')
    ci = tables[1]; version = tables[-1]
    rows = ci.findall(qn('w:tr')); head_tr, green_tr, plain_tr = rows[0], rows[1], rows[2]
    sect = doc.element.body.find(qn('w:sectPr'))
    for k in kids: doc.element.body.remove(k)
    out = []
    def para(tpl, value, bold=False):
        # Plain text keeps the template paragraph's own first-run formatting (cover lines and headings carry their
        # size, weight and color on the run); bracketed fields use the red field formatting.
        p = copy.deepcopy(tpl)
        own = next((r.find(qn('w:rPr')) for r in tpl.iter(qn('w:r')) if r.find(qn('w:rPr')) is not None), None)
        return set_runs(p, value, own if own is not None else plain, red, bold)
    def cell_rpr(tr):
        for r in tr.iter(qn('w:r')):
            rp = r.find(qn('w:rPr'))
            if rp is not None: return rp
        return None
    def table(headers, example, blanks, weights=None):
        tbl = copy.deepcopy(ci)
        for tr in tbl.findall(qn('w:tr')): tbl.remove(tr)
        n = len(headers); weights = weights or [1] * n
        grid = tbl.find(qn('w:tblGrid')); total = sum(int(g.get(qn('w:w'))) for g in grid.findall(qn('w:gridCol')))
        for g in list(grid): grid.remove(g)
        widths = [int(total * w / sum(weights)) for w in weights]
        for wd in widths: grid.append(grid.makeelement(qn('w:gridCol'), {qn('w:w'): str(wd)}))
        def row(tpl, values, kind):
            tr = copy.deepcopy(tpl); proto = tr.findall(qn('w:tc'))[0]
            for tc in tr.findall(qn('w:tc')): tr.remove(tc)
            base = cell_rpr(tpl)
            for value, wd in zip(values, widths):
                tc = copy.deepcopy(proto)
                tcw = tc.find(qn('w:tcPr')).find(qn('w:tcW'))
                if tcw is not None: tcw.set(qn('w:w'), str(wd)); tcw.set(qn('w:type'), 'dxa')
                ps = tc.findall(qn('w:p'))
                for extra in ps[1:]: tc.remove(extra)
                p = ps[0]
                rp = base if kind != 'plain' else (plain_cell if plain_cell is not None else base)
                set_runs(p, value, rp, red_cell if red_cell is not None else red, bold=False)
                tr.append(tc)
            return tr
        plain_cell = None; red_cell = None
        for r in plain_tr.iter(qn('w:r')):
            rp = r.find(qn('w:rPr')); c = rp.find(qn('w:color')) if rp is not None else None
            if c is not None and c.get(qn('w:val')) == '9A3412':
                if red_cell is None: red_cell = rp
            elif rp is not None and plain_cell is None: plain_cell = rp
        tbl.append(row(head_tr, headers, 'head'))
        if example: tbl.append(row(green_tr, example, 'green'))
        for b in blanks: tbl.append(row(plain_tr, b, 'plain'))
        return tbl

    title = spec['title']; fam = INDEX['families'][code]
    out.append(para(cover[0], 'SECURE BY DESIGN  /  TRAINING SAMPLE'))
    out.append(para(cover[1], title))
    out.append(para(cover[2], f"System-level {fam.lower()} plan for a DoD SAP system (JSIG and NIST SP 800-53 Rev. 5 {spec['ref']})"))
    out.append(para(cover[3], 'Every bracketed field is for the learner to complete. Rows shaded green are worked examples with fictional values for the Secure By Design enclave. Section 5 lists every control in the family with its NIST SP 800-53B baseline, so the plan and the SCTM stay in step.'))
    n = 1
    def heading(t):
        nonlocal n; out.append(para(h1, f'{n}. {t}')); n += 1
    heading('Purpose and scope')
    out.append(para(body, f"For [system name and unique identifier], this plan describes {spec['purpose']} ({spec['ref']}). It applies to every component inside the authorization boundary, the people who use and administer them, and [any other scope], and it carries out the {fam.lower()} policy and procedures required by {code}-1."))
    heading('Roles and responsibilities')
    out.append(table(['Role', f'{code} responsibilities'], None, [[ROLES[r], d] for r, d in spec['roles']], [1, 2.2]))
    heading(f'Policy and procedures ({code}-1)')
    out.append(table(['Item', 'Decision for this system'], [f'{fam} policy', f'SBD-POL-{code}-01, {fam} Policy, version 1.0 (fictional)'],
        [['Procedures', '[document and location]'], [f'Official who manages the policy ({code}-1 b)', '[role]'], [f'Policy review ({code}-1 c)', '[frequency, and the events that trigger a review]'], ['Procedure review', '[frequency, and the events that trigger a review]']], [1, 2]))
    for head, intro, headers, example, blanks in spec['sections']:
        heading(head)
        out.append(para(body, intro))
        out.append(table(headers, example, blanks))
    heading('Control implementation summary')
    out.append(para(body, f'Every control in the {fam} family that NIST SP 800-53 Rev. 5 lists, with the enhancements that appear in an SP 800-53B baseline. Mark the controls in [this system\u2019s baseline under CNSSI 1253 and its overlays], then record status, the responsible role and the evidence. Copy the result into the SCTM.'))
    controls = [(cid, v) for cid, v in INDEX['controls'].items() if v[1] == code and ('(' not in cid or v[2])]
    def mark(b):
        if code == 'PM': return 'Organization'
        if code == 'PT': return 'See the SP 800-53B privacy baseline'
        return ', '.join({'L': 'Low', 'M': 'Moderate', 'H': 'High'}[x] for x in b) if b else '—'
    rows_c = [[cid, v[0], mark(v[2]), '[status]', '[role]', '[evidence]'] for cid, v in controls]
    first = rows_c[0]
    example = [first[0], first[1], first[2], 'Implemented', 'ISSM', f'SBD-POL-{code}-01, signed 2026-10-01 (fictional)']
    out.append(table(['Control', 'Title', 'SP 800-53B baseline', 'Status', 'Responsible', 'Evidence'], example, rows_c[1:], [0.75, 2.0, 1.15, 1.15, 1.15, 1.4]))
    heading('Plan review, approval and protection')
    out.append(para(body, f'This plan is reviewed and approved by [role] [frequency] and after any significant change, and is protected from unauthorized disclosure and modification by [method].'))
    out.append(copy.deepcopy(version))
    out.append(para(h2, 'Sources'))
    for s in [JSIG.format(code=code), R5.format(code=code), R5B, CNSSI] + spec['sources']:
        out.append(para(bullet, s))
    out.append(copy.deepcopy(closing))
    for el in out: doc.element.body.insert(len(list(doc.element.body)) - 1, el)
    # Footer and properties
    for s in doc.sections:
        for p in s.footer.paragraphs:
            for r in p.runs:
                if 'Configuration Management Plan' in r.text: r.text = r.text.replace('Configuration Management Plan', title)
    cp = doc.core_properties
    cp.title = title; cp.subject = f'Secure By Design training sample: {fam} ({code})'; cp.author = 'Secure By Design'; cp.last_modified_by = 'Secure By Design'
    cp.comments = 'Training sample written by Secure By Design from the JSIG and NIST SP 800-53 Rev. 5. Not an official form. Fictional data only.'
    path = OUT / f'SBD-Training-{code}-Plan.docx'
    doc.save(str(path))
    return path, len(controls)

def main():
    data = json.loads((ROOT / 'content/ato-templates.json').read_text())
    samples = [s for s in data['samples'] if not re.search(r'SBD-Training-(?!CM-)[A-Z]{2}-Plan\.docx$', s['href'])]
    cm = next(i for i, s in enumerate(samples) if s['href'].endswith('SBD-Training-CM-Plan.docx'))
    new = []
    for code, spec in FAMILIES.items():
        path, count = build(code, spec, TEMPLATE)
        fam = INDEX['families'][code]
        guides = '; '.join(re.sub(r',.*$', '', s) for s in spec['sources'])
        new.append({'group': spec['group'], 'title': re.sub(r'\bpii\b', 'PII', spec['title'][0] + spec['title'][1:].lower(), flags=re.I), 'artifact': spec['tag'],
                    'rmf': spec['rmf'], 'format': 'DOCX', 'href': f'/training/library/training-samples/{path.name}',
                    'basis': f"JSIG {code} family; NIST SP 800-53 Rev. 5 {code} family ({count} controls) and SP 800-53B" + (f'; {guides}' if guides else ''),
                    'note': spec['note']})
        print(f'{path.name}: {count} controls')
    data['samples'] = samples[:cm + 1] + new + samples[cm + 1:]
    (ROOT / 'content/ato-templates.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')

if __name__ == '__main__':
    main()
