export const JMeterTemplate = `
Use the following JSON to generate the Java class:
{outputFile}
{scenarios}
{swaggerPaths}
{swaggerDocs}
{iteration_definition}

Remember to follow all the STRICT RULES provided in the system prompt.

package org.jmeter;
import org.apache.jmeter.config.Arguments;
import org.apache.jmeter.control.LoopController;
import org.apache.jmeter.control.TransactionController;
import org.apache.jmeter.protocol.http.control.Header;
import org.apache.jmeter.protocol.http.control.HeaderManager;
import org.apache.jmeter.protocol.http.sampler.HTTPSamplerProxy;
import org.apache.jmeter.protocol.http.util.HTTPConstants;
import org.apache.jmeter.reporters.ResultCollector;
import org.apache.jmeter.reporters.Summariser;
import org.apache.jmeter.save.SaveService;
import org.apache.jmeter.testelement.TestElement;
import org.apache.jmeter.testelement.TestPlan;
import org.apache.jmeter.threads.ThreadGroup;
import org.apache.jmeter.util.JMeterUtils;
import org.apache.jorphan.collections.HashTree;
import org.apache.jorphan.collections.ListedHashTree;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Properties;

public class {outputFile} {{

    private static final String PROTOCOL = HTTPConstants.PROTOCOL_HTTPS;
    private static final String CONTENT_TYPE_JSON = "application/json";

    private static final String FAKESTORE_DOMAIN = "fakestoreapi.com";


    private static final String FAKESTORE_BASE = "";
   

    public static void main(String[] args) throws Exception {{

        Properties props = new Properties();
        try (FileInputStream fis = new FileInputStream("gradle.properties")) {{
            props.load(fis);
}} catch (IOException e) {{
            props.setProperty("jmeterHome", new File("jmeter").getAbsolutePath());
}}

        String jmeterHome = props.getProperty("jmeterHome");
        JMeterUtils.setJMeterHome(jmeterHome);
        JMeterUtils.loadJMeterProperties(jmeterHome + "/bin/jmeter.properties");
        JMeterUtils.initLocale();
        SaveService.loadProperties();

        TestPlan testPlan = new TestPlan("Config-Driven API Test Plan");
        testPlan.setProperty(TestElement.GUI_CLASS, "TestPlanGui");
        testPlan.setProperty(TestElement.TEST_CLASS, TestPlan.class.getName());
        testPlan.setUserDefinedVariables(new Arguments());

        ListedHashTree testPlanTree = new ListedHashTree();
        HashTree testPlanHashTree = testPlanTree.add(testPlan);

        addScenario_browse_all_products(testPlanHashTree);
        addScenario_create_object_load_50(testPlanHashTree);
        addScenario_ramping_vus_add_pet(testPlanHashTree);

        addListeners(testPlanHashTree);

        File jmx = new File("{outputFile}.jmx");
        try (FileOutputStream out = new FileOutputStream(jmx)) {{
            SaveService.saveTree(testPlanTree, out);
}}

        System.out.println("Generated JMX saved to: " + jmx.getAbsolutePath());
}}

    private static ThreadGroup createTG(String name, int users, int ramp, int durationSec, int delaySec) {{
        LoopController loop = new LoopController();
        loop.setLoops(-1);
        loop.setContinueForever(true);
        loop.initialize();

        ThreadGroup tg = new ThreadGroup();
        tg.setName(name);
        tg.setNumThreads(users);
        tg.setRampUp(ramp);
        tg.setScheduler(true);
        tg.setDuration(durationSec);
        tg.setDelay(delaySec);
        tg.setSamplerController(loop);

        tg.setProperty(TestElement.GUI_CLASS, "ThreadGroupGui");
        tg.setProperty(TestElement.TEST_CLASS, ThreadGroup.class.getName());

        return tg;
}}

    private static HTTPSamplerProxy sampler(String name, String domain, String base, String path, String method) {{
        HTTPSamplerProxy s = new HTTPSamplerProxy();
        s.setName(name);
        s.setDomain(domain);
        s.setProtocol(PROTOCOL);
        s.setPath(base + path);
        s.setMethod(method);
        s.setFollowRedirects(true);
        s.setUseKeepAlive(true);
        s.setAutoRedirects(false);

        s.setProperty(TestElement.GUI_CLASS, "HttpTestSampleGui");
        s.setProperty(TestElement.TEST_CLASS, HTTPSamplerProxy.class.getName());
        return s;
}}

    private static HeaderManager headerJson() {{
        HeaderManager hm = new HeaderManager();
        hm.add(new Header("Content-Type", CONTENT_TYPE_JSON));
        hm.setProperty(TestElement.GUI_CLASS, "HeaderPanel");
        hm.setProperty(TestElement.TEST_CLASS, HeaderManager.class.getName());
        return hm;
}}

    private static void addScenario_browse_all_products(HashTree testPlanTree) {{

        ThreadGroup tg = createTG("browse_all_products (10 users)", 10, 10, 5 * 60, 0);
        HashTree tgTree = testPlanTree.add(tg);

        TransactionController tc = new TransactionController();
        tc.setName("browse_all_products Transaction");
        tc.setGenerateParentSample(true);
        tc.setProperty(TestElement.GUI_CLASS, "TransactionControllerGui");
        tc.setProperty(TestElement.TEST_CLASS, TransactionController.class.getName());

        HashTree tcTree = tgTree.add(tc);

        tcTree.add(sampler("1. GET /products",
                FAKESTORE_DOMAIN, FAKESTORE_BASE, "/products", HTTPConstants.GET));

        tcTree.add(sampler("2. GET /products/{{id}}",
                FAKESTORE_DOMAIN, FAKESTORE_BASE, "/products/1", HTTPConstants.GET));

        HashTree u1 = tcTree.add(sampler("3. POST /users",
                FAKESTORE_DOMAIN, FAKESTORE_BASE, "/users", HTTPConstants.POST));
        u1.add(headerJson());

        HashTree login = tcTree.add(sampler("4. POST /auth/login",
                FAKESTORE_DOMAIN, FAKESTORE_BASE, "/auth/login", HTTPConstants.POST));
        login.add(headerJson());

        HashTree cart = tcTree.add(sampler("5. POST /carts",
                FAKESTORE_DOMAIN, FAKESTORE_BASE, "/carts", HTTPConstants.POST));
        cart.add(headerJson());

        tcTree.add(sampler("6. GET /carts/user/{{userId}}",
                FAKESTORE_DOMAIN, FAKESTORE_BASE, "/carts/user/1", HTTPConstants.GET));
}}



    

    private static void addListeners(HashTree testPlanTree) {{

        Summariser summariser = new Summariser("summary");
        ResultCollector rc = new ResultCollector(summariser);
        rc.setName("Summary Report");
        rc.setProperty(TestElement.GUI_CLASS, "SummaryReport");
        rc.setProperty(TestElement.TEST_CLASS, ResultCollector.class.getName());
        testPlanTree.add(rc);

        ResultCollector agg = new ResultCollector();
        agg.setName("Aggregate Report");
        agg.setProperty(TestElement.GUI_CLASS, "StatVisualizer");
        agg.setProperty(TestElement.TEST_CLASS, ResultCollector.class.getName());
        testPlanTree.add(agg);

        ResultCollector vrt = new ResultCollector();
        vrt.setName("View Results Tree");
        vrt.setProperty(TestElement.GUI_CLASS, "ViewResultsFullVisualizer");
        vrt.setProperty(TestElement.TEST_CLASS, ResultCollector.class.getName());
        vrt.setFilename("");
        testPlanTree.add(vrt);
}}
}}

`;

