import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';

function DefinitionList({ items }) {
  return (
    <dl className="space-y-2">
      {items.map(({ term, desc }) => (
        <div key={term} className="flex gap-2">
          <dt className="font-semibold text-foreground min-w-[180px] shrink-0">{term}</dt>
          <dd className="text-muted-foreground">{desc}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function WikiDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Wiki / Help" className="text-white/80 hover:text-white hover:bg-white/15 gap-1.5 px-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="text-sm font-medium">Wiki</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Wiki &mdash; Contact Terminology Guide</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(85vh-6rem)] pr-2">
          <Accordion>
            <AccordionItem value="source-of-contact">
              <AccordionTrigger>Source of Contact</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Describes how the contact was first identified. If in doubt, choose the option highest up the list.
                </p>
                <DefinitionList items={[
                  { term: 'Internal', desc: 'Contacts known to the project team outside of SEF, e.g. someone met through a different project.' },
                  { term: 'Inherited', desc: 'Contacts provided by ESA or by project teams, where the SEF team did not make first contact, e.g. an existing champion user. Most contacts from the project teams also go into this category.' },
                  { term: 'Event', desc: 'People met at conferences or other events.' },
                  { term: 'Referral', desc: 'Contacts obtained through another stakeholder (not ESA or a project team).' },
                  { term: 'Direct contact', desc: 'People who approach the SEF team directly.' },
                  { term: 'Webform', desc: 'A contact who fills in a form to register for training or a webinar.' },
                ]} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="lead-status">
              <AccordionTrigger>Lead Status</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Indicates the level of interaction between the contact and the SEF team.
                </p>
                <DefinitionList items={[
                  { term: 'Active with SEF', desc: 'We are (or have been) in active contact with this person, i.e. an extended interaction with multiple emails or calls. Examples include contacts for deep dives, or from project teams that we work closely with.' },
                  { term: 'Contact with SEF', desc: 'We are (or have been) in touch by email, calls or meetings (e.g. someone we did a post-event dialog with), but who doesn\'t reach the threshold of being an active collaboration.' },
                  { term: 'Aware of SEF', desc: 'The contact knows who we are (e.g. they have seen a presentation) but we\'re not in active contact with them.' },
                  { term: 'New contact', desc: 'Someone we are not really in contact with at all.' },
                ]} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="stakeholder-type">
              <AccordionTrigger>Stakeholder Type</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Categorises the contact by their organisational role. If in doubt, leave blank &mdash; entries will be checked periodically.
                </p>
                <DefinitionList items={[
                  { term: 'ESA / SEF', desc: 'ESA personnel or SEF team members.' },
                  { term: 'EO Service Provider', desc: 'A contact within the EO industry. This group also includes EO Research (i.e. universities, research institutes).' },
                  { term: 'Non-EO Service Provider', desc: 'A contact who provides commercial services outside EO.' },
                  { term: 'Non-EO Research', desc: 'A contact that works for universities or research institutes not related to EO (e.g. environmental research).' },
                  { term: 'Policy Maker', desc: 'A contact working for an organisation that formulates policy.' },
                  { term: 'Policy Regulator/Enforcer', desc: 'A contact working for an organisation that enforces or regulates a policy once adopted.' },
                  { term: 'Policy Implementer', desc: 'A contact working for an organisation that implements a policy once adopted.' },
                  { term: 'Interest Group', desc: 'A contact working for an organisation not directly affected by policy but with an interest in it, e.g. an industry group.' },
                  { term: 'Other', desc: 'Contacts that do not fit in the above categories, including the SEF team and ESA staff.' },
                ]} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="engagement-type">
              <AccordionTrigger>Engagement Type</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Unlike other fields, you can choose as many options as apply. This captures the types of engagement that have occurred with the contact.
                </p>
                <DefinitionList items={[
                  { term: 'Technical support', desc: 'We have had active technical discussions with this contact.' },
                  { term: 'Requirements gathering', desc: 'We have discussed or collected their needs and requirements.' },
                  { term: 'Coordination', desc: 'We are coordinating activities on events, etc.' },
                  { term: 'Training', desc: 'They have received training from us.' },
                  { term: 'Outreach', desc: 'They have attended webinars or presentations that we have given.' },
                ]} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
