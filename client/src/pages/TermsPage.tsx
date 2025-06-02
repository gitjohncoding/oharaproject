import { Card, CardContent } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-8">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                WeRead Frank O'Hara - Terms and Conditions for Audio Submissions
              </h1>
              <p className="text-muted-foreground italic mb-8">
                Last Updated: December 28, 2024
              </p>
              
              <p className="text-foreground leading-relaxed mb-6">
                By submitting an audio recording to WeRead Frank O'Hara ("the Platform"), operated by WeRead, you agree to the following terms and conditions:
              </p>

              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">1. Grant of Rights</h2>
              <p className="text-foreground leading-relaxed mb-4">
                By uploading your audio recording, you grant WeRead a <strong>perpetual, irrevocable, worldwide, royalty-free, non-exclusive license</strong> to use your submission in any and all ways, including but not limited to:
              </p>

              <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Usage Rights</h3>
              <ul className="text-foreground leading-relaxed mb-4 space-y-2">
                <li><strong>Display and Distribution</strong>: Publish, display, stream, and distribute your recording on the Platform and associated websites</li>
                <li><strong>Educational Use</strong>: Include your recording in educational materials, curricula, and academic research</li>
                <li><strong>Promotional Activities</strong>: Use your recording to promote the Platform, Frank O'Hara's poetry, and poetry education generally</li>
                <li><strong>Archive and Preservation</strong>: Store your recording permanently as part of a digital poetry archive</li>
                <li><strong>Research and Development</strong>: Use your recording for research purposes, including artificial intelligence and machine learning applications</li>
                <li><strong>Format Conversion</strong>: Convert, compress, or modify the technical format of your recording while preserving its content</li>
                <li><strong>Compilation Works</strong>: Include your recording in compilations, collections, or anthology projects</li>
                <li><strong>Third-Party Licensing</strong>: License your recording to educational institutions, researchers, and other platforms that advance poetry appreciation</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Modification Rights</h3>
              <ul className="text-foreground leading-relaxed mb-6 space-y-2">
                <li>Edit your recording for length, audio quality, or technical compatibility</li>
                <li>Add metadata, captions, or contextual information</li>
                <li>Create derivative works that incorporate your recording</li>
              </ul>

              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">2. Your Representations and Warranties</h2>
              <p className="text-foreground leading-relaxed mb-4">
                By submitting your recording, you represent and warrant that:
              </p>
              <ul className="text-foreground leading-relaxed mb-6 space-y-2">
                <li>You are the original creator of the recording and own all rights to it</li>
                <li>You have the legal capacity to enter into this agreement</li>
                <li>Your recording is your original interpretation and performance</li>
                <li>You have not copied or substantially reproduced another person's reading or interpretation</li>
                <li>Your submission does not violate any third-party rights</li>
                <li>You understand that Frank O'Hara's poems may be under copyright protection, and your reading constitutes fair use for educational and transformative purposes</li>
              </ul>

              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">3. Content Standards</h2>
              <p className="text-foreground leading-relaxed mb-4">
                Your submission must:
              </p>
              <ul className="text-foreground leading-relaxed mb-6 space-y-2">
                <li>Be a reading of a Frank O'Hara poem as specified on the Platform</li>
                <li>Be appropriate for all audiences (no offensive language or content beyond that in the original poem)</li>
                <li>Meet technical requirements for audio quality and file format</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>

              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">4. Attribution and Privacy</h2>
              
              <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Attribution Options</h3>
              <ul className="text-foreground leading-relaxed mb-4 space-y-2">
                <li>You may choose to submit your recording with attribution (your name and optional details)</li>
                <li>You may choose to submit anonymously</li>
                <li>Attribution will be provided where practical, but may be omitted in certain uses such as research applications, AI training, or compilations where individual attribution is not feasible</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Privacy</h3>
              <ul className="text-foreground leading-relaxed mb-6 space-y-2">
                <li>Your email address will be used only for moderation communication and will not be publicly displayed or shared with third parties</li>
                <li>Optional location and background information may be displayed publicly if you choose to provide it</li>
                <li>We will handle your personal information in accordance with our Privacy Policy</li>
              </ul>

              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">5. Moderation and Quality Control</h2>
              <ul className="text-foreground leading-relaxed mb-6 space-y-2">
                <li>All submissions are subject to review and approval before publication</li>
                <li>We reserve the right to reject submissions that don't meet our content or quality standards</li>
                <li>We may edit submissions for technical quality while preserving artistic interpretation</li>
                <li>Approved recordings become part of the permanent collection</li>
              </ul>

              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">6. No Compensation</h2>
              <p className="text-foreground leading-relaxed mb-4">
                This is a community-driven, educational project. You will not receive monetary compensation for your submission, but you will receive:
              </p>
              <ul className="text-foreground leading-relaxed mb-6 space-y-2">
                <li>Attribution credit (if desired)</li>
                <li>The satisfaction of contributing to poetry education and preservation</li>
                <li>Participation in a unique digital humanities project</li>
              </ul>

              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">7. Platform Rights and Responsibilities</h2>
              
              <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Our Rights</h3>
              <ul className="text-foreground leading-relaxed mb-4 space-y-2">
                <li>Moderate and curate submissions to maintain quality and appropriateness</li>
                <li>Modify the Platform's features, design, and functionality</li>
                <li>Establish additional guidelines for submissions</li>
                <li>Remove or modify content that violates these terms</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Our Responsibilities</h3>
              <ul className="text-foreground leading-relaxed mb-6 space-y-2">
                <li>Make reasonable efforts to preserve your recordings</li>
                <li>Provide attribution according to your preferences where practical and feasible</li>
                <li>Operate the Platform in good faith for educational and cultural purposes</li>
              </ul>

              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">8. Intellectual Property</h2>
              <ul className="text-foreground leading-relaxed mb-6 space-y-2">
                <li>You retain copyright in your original vocal performance</li>
                <li>The Platform and its operators claim no ownership of your performance itself</li>
                <li>Frank O'Hara's poems remain subject to their original copyright status</li>
                <li>The compilation and curation of recordings may be subject to separate copyright protection</li>
              </ul>

              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">9. Disclaimer and Limitation of Liability</h2>
              <p className="text-foreground leading-relaxed mb-4">
                The Platform is provided "as is" without warranties. WeRead is not liable for:
              </p>
              <ul className="text-foreground leading-relaxed mb-6 space-y-2">
                <li>Technical issues that may affect your recording</li>
                <li>Loss of data or recordings due to technical failures</li>
                <li>Any disputes arising from the use of your recordings in accordance with these terms</li>
                <li>Third-party use of recordings that we have properly licensed</li>
              </ul>

              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">10. Termination and Survival</h2>
              <ul className="text-foreground leading-relaxed mb-6 space-y-2">
                <li>These terms remain in effect permanently for submitted recordings</li>
                <li>If the Platform discontinues, rights granted to recordings may transfer to educational institutions or poetry preservation organizations</li>
                <li>Your moral rights as a performer are preserved to the extent required by law</li>
              </ul>

              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">11. Updates to Terms</h2>
              <p className="text-foreground leading-relaxed mb-4">
                We may update these terms to:
              </p>
              <ul className="text-foreground leading-relaxed mb-6 space-y-2">
                <li>Clarify existing provisions</li>
                <li>Add new use cases that further the educational mission</li>
                <li>Comply with legal requirements</li>
                <li>Improve user experience</li>
              </ul>
              <p className="text-foreground leading-relaxed mb-6">
                Material changes will be posted prominently on the Platform. Continued use constitutes acceptance of updated terms.
              </p>

              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">12. Governing Law and Disputes</h2>
              <p className="text-foreground leading-relaxed mb-6">
                These terms are governed by Delaware law. Any disputes will be resolved through binding arbitration or in the courts of Delaware.
              </p>

              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">13. Additional Information</h2>
              <p className="text-foreground leading-relaxed mb-8">
                For additional information about the Platform, visit the WeRead Frank O'Hara website.
              </p>

              <hr className="my-8 border-border" />

              <div className="bg-primary/5 p-6 rounded-lg mb-8">
                <p className="text-foreground font-semibold mb-4">
                  By clicking "I Agree" and submitting your recording, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
                </p>
              </div>

              <hr className="my-8 border-border" />

              <p className="text-muted-foreground italic text-center">
                WeRead Frank O'Hara is a community-driven educational project celebrating poetry through diverse voices. Your participation helps preserve and share Frank O'Hara's work with future generations and advances the intersection of humanities and technology.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}