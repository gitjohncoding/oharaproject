import nodemailer from 'nodemailer';

interface EmailConfig {
  service?: string;
  host?: string;
  port?: number;
  secure?: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface SubmissionEmailData {
  submissionId: number;
  readerName: string;
  poemTitle: string;
  email: string;
  location?: string;
  background?: string;
  interpretationNote?: string;
  fileName: string;
  approvalToken: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private adminEmail: string;
  private baseUrl: string;

  constructor() {
    this.adminEmail = 'johntclinkscales@gmail.com';
    this.baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      const emailConfig: EmailConfig = {
        auth: {
          user: process.env.EMAIL_USER || '',
          pass: process.env.EMAIL_PASS || ''
        }
      };

      // Use Gmail if specified
      if (process.env.EMAIL_SERVICE === 'gmail') {
        emailConfig.service = 'gmail';
      } else {
        // Use custom SMTP settings
        emailConfig.host = process.env.EMAIL_HOST || 'smtp.gmail.com';
        emailConfig.port = parseInt(process.env.EMAIL_PORT || '587');
        emailConfig.secure = process.env.EMAIL_SECURE === 'true';
      }

      this.transporter = nodemailer.createTransport(emailConfig);
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
    }
  }

  async sendSubmissionNotification(data: SubmissionEmailData): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email transporter not initialized');
      return false;
    }

    const approveUrl = `${this.baseUrl}/api/admin/approve/${data.approvalToken}`;
    const rejectUrl = `${this.baseUrl}/api/admin/reject/${data.approvalToken}`;
    const audioUrl = `${this.baseUrl}/uploads/${data.fileName}`;

    const htmlContent = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #F5F7FA;">
        <div style="background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #2C3E50; margin-bottom: 20px; font-size: 24px;">New Poetry Recording Submission</h1>
          
          <div style="background-color: #4A90E2; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 18px;">${data.poemTitle}</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Read by ${data.readerName}</p>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="color: #2C3E50; margin-bottom: 10px;">Submission Details:</h3>
            <ul style="color: #8B9DC3; line-height: 1.6;">
              <li><strong>Reader:</strong> ${data.readerName}</li>
              <li><strong>Email:</strong> ${data.email}</li>
              ${data.location ? `<li><strong>Location:</strong> ${data.location}</li>` : ''}
              ${data.background ? `<li><strong>Background:</strong> ${data.background}</li>` : ''}
              <li><strong>File:</strong> ${data.fileName}</li>
            </ul>
          </div>

          ${data.interpretationNote ? `
            <div style="margin-bottom: 20px;">
              <h3 style="color: #2C3E50; margin-bottom: 10px;">Reader's Note:</h3>
              <p style="color: #8B9DC3; font-style: italic; background-color: #F5F7FA; padding: 15px; border-radius: 8px;">
                "${data.interpretationNote}"
              </p>
            </div>
          ` : ''}

          <div style="margin-bottom: 20px;">
            <h3 style="color: #2C3E50; margin-bottom: 10px;">Audio Recording:</h3>
            <p style="margin-bottom: 10px;">
              <a href="${audioUrl}" style="color: #4A90E2; text-decoration: none;">🎵 Listen to Recording</a>
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${this.baseUrl}/admin" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
              Go to Admin Panel
            </a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center;">
            <p style="color: #8B9DC3; font-size: 14px; margin: 0;">
              Voices for Frank O'Hara Poetry Archive<br>
              <a href="${this.baseUrl}" style="color: #4A90E2;">Visit Website</a>
            </p>
          </div>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: this.adminEmail,
        subject: `New Poetry Submission: ${data.poemTitle} by ${data.readerName}`,
        html: htmlContent,
      });

      console.log('Submission notification email sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send submission notification email:', error);
      return false;
    }
  }

  async sendApprovalConfirmation(email: string, readerName: string, poemTitle: string): Promise<boolean> {
    if (!this.transporter) return false;

    const htmlContent = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #F5F7FA;">
        <div style="background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #2C3E50; margin-bottom: 20px; font-size: 24px;">Your Recording Has Been Approved!</h1>
          
          <p style="color: #8B9DC3; line-height: 1.6;">
            Dear ${readerName},
          </p>
          
          <p style="color: #8B9DC3; line-height: 1.6;">
            We're delighted to let you know that your reading of "<strong>${poemTitle}</strong>" has been approved and is now live on the Voices for Frank O'Hara website.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.baseUrl}" 
               style="background-color: #4A90E2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
              View Your Recording
            </a>
          </div>

          <p style="color: #8B9DC3; line-height: 1.6;">
            Thank you for contributing to this celebration of Frank O'Hara's poetry through your unique voice and interpretation.
          </p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center;">
            <p style="color: #8B9DC3; font-size: 14px; margin: 0;">
              Voices for Frank O'Hara Poetry Archive
            </p>
          </div>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Your poetry reading has been approved - ${poemTitle}`,
        html: htmlContent,
      });

      return true;
    } catch (error) {
      console.error('Failed to send approval confirmation email:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
