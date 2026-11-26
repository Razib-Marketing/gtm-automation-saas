import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  Code2,
  ShieldCheck,
  Bell,
  Sliders,
  ArrowRight,
  Globe,
  BarChart3,
  Zap
} from 'lucide-react';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import { PageTransition } from '../components/ui/PageTransition';
import { GA4Dashboard } from '../components/analytics/GA4Dashboard';
import { getWebsiteTypeMeta } from '../types/project';
import type { Project } from '../types/project';
import './Dashboard.css';

interface ProjectOverviewProps {
  project: Project;
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({ project }) => {
  const typeMeta = getWebsiteTypeMeta(project.website_type);

  const statCards = [
    {
      label: 'GTM Container & Audit',
      value: project.latestGtmScore !== null && project.latestGtmScore !== undefined ? `${project.latestGtmScore}%` : 'Ready',
      sub: project.gtm_container_public_id
        ? `${project.gtm_container_public_id} (${project.gtm_workspace_name || 'Default'})`
        : 'No GTM container linked yet',
      icon: <Code2 size={20} color="#00F0FF" />,
      color: '#00F0FF',
      to: `/projects/${project.id}/gtm`
    },
    {
      label: '22-Point GA4 Audit Score',
      value: project.latestGa4Score !== null && project.latestGa4Score !== undefined ? `${project.latestGa4Score}%` : 'Unscanned',
      sub: project.ga4_property_name || project.ga4_property_id || 'No GA4 property linked yet',
      icon: <ShieldCheck size={20} color="#10B981" />,
      color: '#10B981',
      to: `/projects/${project.id}/observer`
    },
    {
      label: 'Active GA4 Monitors',
      value: String(project.monitorCount || 0),
      sub: 'Autonomous edge anomaly rules',
      icon: <Activity size={20} color="#38BDF8" />,
      color: '#38BDF8',
      to: `/projects/${project.id}/observer`
    },
    {
      label: 'Alert Logs Recorded',
      value: String(project.alertCount || 0),
      sub: 'Automated & manual health dispatches',
      icon: <Bell size={20} color="#F59E0B" />,
      color: '#F59E0B',
      to: `/projects/${project.id}/observer`
    }
  ];

  const quickActions = [
    {
      title: 'Deploy GTM Recipes & Audit Workspace',
      desc: 'Install pre-built GA4 tags, form triggers, booking engines, or run a GTM Workspace Health Audit.',
      icon: <Zap size={20} color="#00F0FF" />,
      to: `/projects/${project.id}/gtm`,
      cta: 'Open GTM Workspace'
    },
    {
      title: 'GA4 Observer & 22-Point Property Audit',
      desc: 'Manage project anomaly monitors, send test email reports, or generate a 22-point GA4 Audit PDF.',
      icon: <ShieldCheck size={20} color="#10B981" />,
      to: `/projects/${project.id}/observer`,
      cta: 'Open GA4 Observer'
    },
    {
      title: 'Project Analytics & Audit Trail',
      desc: 'Review 30-day GA4 sessions, conversions, revenue trends, and project audit logs.',
      icon: <BarChart3 size={20} color="#A855F7" />,
      to: `/projects/${project.id}/analytics`,
      cta: 'View Project Analytics'
    }
  ];

  return (
    <PageTransition locationKey={`project-overview-${project.id}`}>
      <BackgroundMesh />
      <div className="dashboard-container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="dashboard-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.55rem' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  color: typeMeta.color,
                  background: `${typeMeta.color}1A`,
                  border: `1px solid ${typeMeta.color}44`
                }}
              >
                {typeMeta.badge}
              </span>
              {project.gtm_container_public_id && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                    color: '#00F0FF',
                    background: 'rgba(0, 240, 255, 0.1)',
                    border: '1px solid rgba(0, 240, 255, 0.25)'
                  }}
                >
                  {project.gtm_container_public_id}
                </span>
              )}
              {project.website_url && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: '#9CA3AF' }}>
                  <Globe size={13} /> {project.website_url}
                </span>
              )}
            </div>

            <h1 className="dashboard-title">{project.name}</h1>
            <p className="dashboard-subtitle">
              Dedicated project workspace. All metrics, GTM tags, Observer monitors, and audit logs below belong strictly to this project.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link
              to={`/projects/${project.id}/observer`}
              className="btn-deploy-bulk"
              style={{ marginTop: 0, textDecoration: 'none' }}
            >
              <ShieldCheck size={16} style={{ marginRight: '0.4rem' }} />
              GA4 Observer &amp; Audit
            </Link>
            <Link
              to={`/projects/${project.id}/settings`}
              style={{
                textDecoration: 'none',
                padding: '0.72rem 1.1rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.14)',
                color: '#E5E7EB',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Sliders size={15} /> Project Settings
            </Link>
          </div>
        </motion.div>

        {/* 4 Project KPI Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}
        >
          {statCards.map((card) => (
            <Link key={card.label} to={card.to} style={{ textDecoration: 'none' }}>
              <div
                className="module-card"
                style={{
                  padding: '1.25rem',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: '#9CA3AF', fontWeight: 600 }}>{card.label}</span>
                  <div
                    style={{
                      padding: '0.45rem',
                      borderRadius: '8px',
                      background: `${card.color}16`,
                      border: `1px solid ${card.color}33`
                    }}
                  >
                    {card.icon}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white' }}>{card.value}</div>
                  <div style={{ fontSize: '0.76rem', color: '#9CA3AF', marginTop: '0.2rem' }}>{card.sub}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Workspace Tools */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}
        >
          {quickActions.map((act) => (
            <div
              key={act.title}
              className="module-card"
              style={{
                padding: '1.35rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.9rem',
                cursor: 'default'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  {act.icon}
                  <h3 style={{ margin: 0, fontSize: '1rem', color: 'white' }}>{act.title}</h3>
                </div>
                <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.84rem', lineHeight: 1.5 }}>{act.desc}</p>
              </div>
              <Link
                to={act.to}
                style={{
                  textDecoration: 'none',
                  color: '#00F0FF',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                {act.cta} <ArrowRight size={15} />
              </Link>
            </div>
          ))}
        </div>

        {/* Scoped GA4 30d Performance */}
        <GA4Dashboard
          lockedPropertyId={project.ga4_property_id || undefined}
          lockedPropertyName={project.ga4_property_name || undefined}
          projectName={project.name}
          projectId={project.id}
        />
      </div>
    </PageTransition>
  );
};
